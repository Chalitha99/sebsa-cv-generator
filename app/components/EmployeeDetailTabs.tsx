'use client';
import React, { useId, useState } from 'react';
import { flushSync } from 'react-dom';
import { employeeDetailFields, profileTabs, type EmployeeDetails, type ProfileTab } from '@/lib/employeeDetails';
import { inputCls } from './CvEntrySections';

type Value = EmployeeDetails & { name: string; role: string; department: string; email: string };
interface Props {
  value: Value;
  onChange?: (value: Value) => void;
  departments?: { id: string; name: string }[];
  emailEditable?: boolean;
  children: React.ReactNode;
}
/** Shared by profile creation, detailed viewing, and updating. */
export default function EmployeeDetailTabs({ value, onChange, departments = [], emailEditable = true, children }: Props) {
  const [active, setActive] = useState<ProfileTab>('Overview');
  const id = useId();
  const basicFields = [
    { key: 'name', label: 'Full Name', type: 'text', tab: 'Overview' },
    { key: 'role', label: 'Designation', type: 'text', tab: 'Overview' },
    { key: 'department', label: 'Department', type: 'text', tab: 'Overview' },
    { key: 'email', label: 'Work Email', type: 'email', tab: 'Address & Contacts' },
  ] as const;
  const allFields = [...basicFields, ...employeeDetailFields];
  const emergencyGroups = [
    { title: 'Primary Emergency Contact', keys: ['emergencyContactName', 'emergencyPhone', 'relation'] },
    { title: 'Secondary Emergency Contact', keys: ['secondaryEmergencyContact', 'secondaryEmergencyPhone', 'secondaryRelation'] },
  ] as const;
  const emergencyKeys = new Set<string>(emergencyGroups.flatMap(group => [...group.keys]));
  const renderField = (field: typeof allFields[number], label: string = field.label) => {
    const tab = field.tab;
    const relationship = field.key === 'relation' || field.key === 'secondaryRelation';
          const fieldId = id + '-' + field.key;
          const editable = onChange && (field.key !== 'email' || emailEditable);
          return <div key={field.key} className="space-y-2 min-w-0">
            <label htmlFor={editable ? fieldId : undefined} className="block text-xs font-bold text-slate-500">{label}</label>
            {!editable ? <p className="text-sm leading-relaxed text-slate-800 break-words">{(value[field.key] ?? '') === '' ? 'Not provided' : value[field.key]}</p> : field.key === 'department' ?
              <select id={fieldId} value={value.department} onChange={e => onChange({ ...value, department: e.target.value })} className={inputCls}>
                {!departments.some(d => d.name === value.department) && <option value={value.department}>{value.department || 'Select department'}</option>}
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select> : <input id={fieldId} aria-describedby={relationship ? fieldId + '-hint' : undefined} type={field.type} value={value[field.key] ?? ''} min={field.type === 'number' ? 0 : undefined} step={field.type === 'number' ? 1 : undefined}
                onInvalid={() => flushSync(() => setActive(tab))} required={field.key === 'name' || field.key === 'role' || field.key === 'email'}
                onChange={e => onChange({ ...value, [field.key]: field.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value })} className={inputCls} />}
            {relationship && <p id={fieldId + '-hint'} className="text-xs leading-relaxed text-slate-400">e.g. Mother, Father, Spouse, Sibling, Guardian</p>}
          </div>;
  };
  return <div className="min-w-0">
    <div role="tablist" aria-label="Employee profile sections" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-2 sm:px-4 pt-2">
      {profileTabs.map((tab, index) => <button key={tab} type="button" role="tab" id={id + '-tab-' + index}
        aria-selected={active === tab} aria-controls={id + '-panel-' + index} tabIndex={active === tab ? 0 : -1}
        onClick={() => setActive(tab)} onKeyDown={e => {
          let next = index;
          if (e.key === 'ArrowRight') next = (index + 1) % profileTabs.length;
          else if (e.key === 'ArrowLeft') next = (index + profileTabs.length - 1) % profileTabs.length;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = profileTabs.length - 1;
          else return;
          e.preventDefault(); setActive(profileTabs[next]); document.getElementById(id + '-tab-' + next)?.focus();
        }} className={'shrink-0 px-4 py-3 text-xs font-bold border-b-2 ' + (active === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500')}>
        {tab}
      </button>)}
    </div>
    {profileTabs.map((tab, index) => <div key={tab} role="tabpanel" id={id + '-panel-' + index} aria-labelledby={id + '-tab-' + index} hidden={active !== tab} className="p-4 sm:p-6">
      {tab === 'Profile' ? children : <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {allFields.filter(field => field.tab === tab && !emergencyKeys.has(field.key)).map(field => renderField(field))}
        </div>
        {tab === 'Address & Contacts' && emergencyGroups.map(group => <fieldset key={group.title} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
          <legend className="px-2 text-xs font-bold text-slate-700">{group.title}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {group.keys.map((key, index) => renderField(
              allFields.find(field => field.key === key)!,
              ['Contact Name', 'Phone Number', 'Relationship to Employee'][index],
            ))}
          </div>
        </fieldset>)}
      </div>}
    </div>)}
  </div>;
}
