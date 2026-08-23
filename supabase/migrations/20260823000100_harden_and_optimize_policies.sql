do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

create index payments_created_by_idx on public.payments(created_by) where created_by is not null;

drop policy reference_courses_admin on public.courses;
create policy courses_admin_insert on public.courses for insert to authenticated with check (private.is_admin());
create policy courses_admin_update on public.courses for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy courses_admin_delete on public.courses for delete to authenticated using (private.is_admin());

drop policy reference_batches_admin on public.batches;
create policy batches_admin_insert on public.batches for insert to authenticated with check (private.is_admin());
create policy batches_admin_update on public.batches for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy batches_admin_delete on public.batches for delete to authenticated using (private.is_admin());

drop policy reference_plans_admin on public.membership_plans;
create policy plans_admin_insert on public.membership_plans for insert to authenticated with check (private.is_admin());
create policy plans_admin_update on public.membership_plans for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy plans_admin_delete on public.membership_plans for delete to authenticated using (private.is_admin());

drop policy students_admin_write on public.students;
create policy students_admin_insert on public.students for insert to authenticated with check (private.is_admin());
create policy students_admin_update on public.students for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy students_admin_delete on public.students for delete to authenticated using (private.is_admin());

drop policy fees_admin_write on public.monthly_fees;
create policy fees_admin_insert on public.monthly_fees for insert to authenticated with check (private.is_admin());
create policy fees_admin_update on public.monthly_fees for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy fees_admin_delete on public.monthly_fees for delete to authenticated using (private.is_admin());

drop policy payments_admin_write on public.payments;
create policy payments_admin_insert on public.payments for insert to authenticated with check (private.is_admin());
create policy payments_admin_update on public.payments for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy payments_admin_delete on public.payments for delete to authenticated using (private.is_admin());

drop policy notifications_admin_write on public.notifications;
drop policy notifications_student_update on public.notifications;
create policy notifications_admin_insert on public.notifications for insert to authenticated with check (private.is_admin());
create policy notifications_update on public.notifications for update to authenticated
  using (private.is_admin() or (target_role = 'student' and exists (select 1 from public.students s where s.id = student_id and s.user_id = (select auth.uid()))))
  with check (private.is_admin() or (target_role = 'student' and exists (select 1 from public.students s where s.id = student_id and s.user_id = (select auth.uid()))));
create policy notifications_admin_delete on public.notifications for delete to authenticated using (private.is_admin());

drop policy settings_admin_write on public.institute_settings;
create policy settings_admin_update on public.institute_settings for update to authenticated using (private.is_admin()) with check (private.is_admin());
