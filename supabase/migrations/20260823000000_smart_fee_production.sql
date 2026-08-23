create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'student');
create type public.student_status as enum ('active', 'inactive');
create type public.payment_method as enum ('Cash', 'UPI', 'Bank Transfer', 'Card', 'Other');
create type public.payment_type as enum ('FEE', 'MEMBERSHIP_RENEWAL', 'REGISTRATION', 'MISC');
create type public.payment_status as enum ('SUCCESS', 'PENDING', 'FAILED');
create type public.notification_target as enum ('admin', 'student', 'all');
create type public.notification_type as enum ('fee', 'membership', 'payment', 'system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  full_name text not null default '',
  email text,
  phone text,
  avatar_url text,
  institute_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  instrument text not null,
  code text unique,
  description text not null default '',
  fee_per_month numeric(12,2) not null check (fee_per_month >= 0),
  duration text,
  icon_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  name text not null,
  time_slot text not null,
  days text[] not null default '{}',
  instructor text not null default '',
  capacity integer not null default 10 check (capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_months integer not null check (duration_months > 0),
  price numeric(12,2) not null check (price >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  description text not null default '',
  is_popular boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  student_code text not null unique,
  full_name text not null,
  email text,
  mobile text not null,
  whatsapp text,
  address text not null default '',
  course_id uuid references public.courses(id) on delete restrict,
  batch_id uuid references public.batches(id) on delete restrict,
  joining_date date not null default current_date,
  monthly_fee numeric(12,2) not null check (monthly_fee >= 0),
  plan_id uuid references public.membership_plans(id) on delete set null,
  membership_start_date date,
  membership_end_date date,
  fee_due_day integer not null default 5 check (fee_due_day between 1 and 28),
  status public.student_status not null default 'active',
  notes text,
  avatar_url text,
  parent_name text,
  guardian_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (membership_end_date is null or membership_start_date is null or membership_end_date >= membership_start_date)
);

create table public.monthly_fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  fee_month date not null check (fee_month = date_trunc('month', fee_month)::date),
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  payment_date date,
  payment_method public.payment_method,
  transaction_id text,
  notes text,
  invoice_number text not null unique,
  late_fee numeric(12,2) not null default 0 check (late_fee >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, fee_month)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  fee_id uuid references public.monthly_fees(id) on delete set null,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  method public.payment_method not null,
  transaction_ref text,
  type public.payment_type not null,
  status public.payment_status not null default 'SUCCESS',
  notes text,
  receipt_number text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  target_role public.notification_target not null,
  student_id uuid references public.students(id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null,
  read boolean not null default false,
  action_link text,
  created_at timestamptz not null default now(),
  check ((target_role = 'student' and student_id is not null) or target_role <> 'student')
);

create table public.institute_settings (
  id boolean primary key default true check (id),
  institute_name text not null default 'Music Institute',
  tagline text,
  logo_url text,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  address text,
  currency_symbol text not null default '₹',
  currency_code text not null default 'INR',
  default_fee_due_day integer not null default 5 check (default_fee_due_day between 1 and 28),
  late_fee_amount numeric(12,2) not null default 0 check (late_fee_amount >= 0),
  fee_reminder_template text,
  overdue_reminder_template text,
  membership_reminder_template text,
  upi_id text,
  bank_details jsonb,
  enable_sound_effects boolean not null default true,
  enable_auto_whatsapp_prompt boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.institute_settings (id) values (true) on conflict do nothing;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated before update on public.profiles for each row execute function private.set_updated_at();
create trigger courses_updated before update on public.courses for each row execute function private.set_updated_at();
create trigger batches_updated before update on public.batches for each row execute function private.set_updated_at();
create trigger membership_plans_updated before update on public.membership_plans for each row execute function private.set_updated_at();
create trigger students_updated before update on public.students for each row execute function private.set_updated_at();
create trigger monthly_fees_updated before update on public.monthly_fees for each row execute function private.set_updated_at();
create trigger settings_updated before update on public.institute_settings for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, new.phone);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function public.generate_monthly_fees(target_month date default current_date)
returns integer language plpgsql security invoker set search_path = '' as $$
declare inserted_count integer;
begin
  if not private.is_admin() then raise exception 'Admin access required'; end if;
  insert into public.monthly_fees (student_id, fee_month, amount, due_date, invoice_number, notes)
  select s.id, date_trunc('month', target_month)::date, s.monthly_fee,
         (date_trunc('month', target_month)::date + (s.fee_due_day - 1))::date,
         'INV-' || to_char(target_month, 'YYYYMM') || '-' || upper(substr(replace(s.id::text, '-', ''), 1, 8)),
         'Automatically generated monthly fee'
  from public.students s where s.status = 'active'
  on conflict (student_id, fee_month) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
revoke all on function public.generate_monthly_fees(date) from public, anon;
grant execute on function public.generate_monthly_fees(date) to authenticated;

create view public.monthly_fee_status with (security_invoker = true) as
select f.*,
  case when f.payment_date is not null then 'PAID'
       when f.due_date < current_date then 'OVERDUE'
       when f.due_date = current_date then 'DUE TODAY'
       else 'UPCOMING' end as status
from public.monthly_fees f;

create view public.student_membership_status with (security_invoker = true) as
select s.id as student_id,
  case when s.membership_end_date is null or s.membership_end_date < current_date then 'EXPIRED'
       when s.membership_end_date = current_date then 'EXPIRING TODAY'
       when s.membership_end_date <= current_date + 10 then 'EXPIRING SOON'
       else 'ACTIVE' end as status
from public.students s;

create index batches_course_id_idx on public.batches(course_id);
create index students_user_id_idx on public.students(user_id) where user_id is not null;
create index students_course_id_idx on public.students(course_id);
create index students_batch_id_idx on public.students(batch_id);
create index students_plan_id_idx on public.students(plan_id);
create index monthly_fees_student_due_idx on public.monthly_fees(student_id, due_date desc);
create index monthly_fees_unpaid_due_idx on public.monthly_fees(due_date) where payment_date is null;
create index payments_student_paid_idx on public.payments(student_id, paid_at desc);
create index payments_fee_id_idx on public.payments(fee_id) where fee_id is not null;
create index notifications_student_created_idx on public.notifications(student_id, created_at desc) where student_id is not null;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.batches enable row level security;
alter table public.membership_plans enable row level security;
alter table public.students enable row level security;
alter table public.monthly_fees enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.institute_settings enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (id = (select auth.uid()) or private.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy reference_courses_read on public.courses for select to authenticated using (true);
create policy reference_courses_admin on public.courses for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy reference_batches_read on public.batches for select to authenticated using (true);
create policy reference_batches_admin on public.batches for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy reference_plans_read on public.membership_plans for select to authenticated using (true);
create policy reference_plans_admin on public.membership_plans for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy students_select on public.students for select to authenticated using (private.is_admin() or user_id = (select auth.uid()));
create policy students_admin_write on public.students for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy fees_select on public.monthly_fees for select to authenticated using (private.is_admin() or exists (select 1 from public.students s where s.id = student_id and s.user_id = (select auth.uid())));
create policy fees_admin_write on public.monthly_fees for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy payments_select on public.payments for select to authenticated using (private.is_admin() or exists (select 1 from public.students s where s.id = student_id and s.user_id = (select auth.uid())));
create policy payments_admin_write on public.payments for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy notifications_select on public.notifications for select to authenticated using (
  private.is_admin() or target_role = 'all' or (target_role = 'student' and exists (select 1 from public.students s where s.id = student_id and s.user_id = (select auth.uid())))
);
create policy notifications_admin_write on public.notifications for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy notifications_student_update on public.notifications for update to authenticated
  using (target_role = 'student' and exists (select 1 from public.students s where s.id = student_id and s.user_id = (select auth.uid())))
  with check (target_role = 'student' and exists (select 1 from public.students s where s.id = student_id and s.user_id = (select auth.uid())));
create policy settings_read on public.institute_settings for select to authenticated using (true);
create policy settings_admin_write on public.institute_settings for all to authenticated using (private.is_admin()) with check (private.is_admin());

grant usage on schema public to authenticated;
grant select on public.profiles, public.courses, public.batches, public.membership_plans, public.students, public.monthly_fees, public.payments, public.notifications, public.institute_settings to authenticated;
grant insert, update, delete on public.courses, public.batches, public.membership_plans, public.students, public.monthly_fees, public.payments, public.notifications to authenticated;
grant update on public.profiles, public.institute_settings to authenticated;
grant select on public.monthly_fee_status, public.student_membership_status to authenticated;

