import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings as SettingsType } from '../../types';
import { Settings, Building2, MessageSquare, DollarSign, RotateCcw, Check, Sparkles } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetToDemoData } = useApp();

  const [formData, setFormData] = useState<SettingsType>(settings);
  const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'financials'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof SettingsType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif italic text-zinc-100 tracking-tight flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-amber-500" />
            <span>Academy & Automation Preferences</span>
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Configure institute branding, receipt typography headers, and WhatsApp template tokens.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all demo data back to factory defaults?')) {
                resetToDemoData();
              }
            }}
            className="py-2 px-3.5 bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-800/60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-mono w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Academy Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financials')}
          className={`py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'financials'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Billing Rules</span>
        </button>
      </div>

      {/* FORM CONTENT */}
      <form onSubmit={handleSave} className="space-y-6 font-mono">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-6 bg-[#111113] border border-zinc-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-serif italic text-zinc-100">
              Academy General Details & Receipt Headers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  Institute Name *
                </label>
                <input
                  type="text"
                  value={formData.instituteName}
                  onChange={(e) => handleChange('instituteName', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  Institute Tagline
                </label>
                <input
                  type="text"
                  value={formData.instituteTagline}
                  onChange={(e) => handleChange('instituteTagline', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  Primary Phone *
                </label>
                <input
                  type="text"
                  value={formData.institutePhone}
                  onChange={(e) => handleChange('institutePhone', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  Support Email *
                </label>
                <input
                  type="email"
                  value={formData.instituteEmail}
                  onChange={(e) => handleChange('instituteEmail', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  Campus Address (Printed on Receipts) *
                </label>
                <input
                  type="text"
                  value={formData.instituteAddress}
                  onChange={(e) => handleChange('instituteAddress', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Templates Tab */}
        {activeTab === 'templates' && (
          <div className="p-6 bg-[#111113] border border-zinc-800 rounded-2xl shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-serif italic text-zinc-100">
                WhatsApp Dispatch Message Templates
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Available Tokens: {'{student_name}'}, {'{month}'}, {'{amount}'}, {'{due_date}'}, {'{institute_name}'}, {'{plan_name}'}, {'{expiry_date}'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  1. Standard Monthly Fee Reminder Template
                </label>
                <textarea
                  rows={4}
                  value={formData.whatsappFeeReminderTemplate}
                  onChange={(e) => handleChange('whatsappFeeReminderTemplate', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  2. Overdue Fee Urgent Reminder Template
                </label>
                <textarea
                  rows={4}
                  value={formData.whatsappOverdueReminderTemplate}
                  onChange={(e) => handleChange('whatsappOverdueReminderTemplate', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  3. Membership Expiry & Renewal Template
                </label>
                <textarea
                  rows={4}
                  value={formData.whatsappMembershipExpiryTemplate}
                  onChange={(e) => handleChange('whatsappMembershipExpiryTemplate', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Financials Tab */}
        {activeTab === 'financials' && (
          <div className="p-6 bg-[#111113] border border-zinc-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-serif italic text-zinc-100">
              Billing Defaults & Currency Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  Currency Symbol *
                </label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  Default Fee Due Day (1 - 28) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.defaultFeeDueDay}
                  onChange={(e) => handleChange('defaultFeeDueDay', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  Default Late Fee Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.lateFeeAmount}
                  onChange={(e) => handleChange('lateFeeAmount', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl">
          <span className="text-xs text-zinc-400">
            {saveSuccess ? '✓ Settings synced successfully across all modules' : 'Sync modifications across all modules'}
          </span>
          <button
            type="submit"
            className="py-2 px-5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
