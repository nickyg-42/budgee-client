import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import { ConditionsBuilder } from '../components/transactionRules/ConditionsBuilder';
import type { TransactionRule, ConditionNode, ConditionGroup, ConditionLeaf } from '../types';
import { PERSONAL_FINANCE_CATEGORY_OPTIONS, getCategoryLabelFromConstants } from '../constants/personalFinanceCategories';
import { Plus, Pencil, Trash2, PlayCircle, HelpCircle } from 'lucide-react';
import { formatDateTimeLocal } from '@/utils/formatters';

const isGroup = (node: ConditionNode): node is ConditionGroup => {
  return typeof node === 'object' && (Array.isArray((node as any).and) || Array.isArray((node as any).or));
};

const isLeaf = (node: ConditionNode): node is ConditionLeaf => {
  return typeof node === 'object' && (node as any).field !== undefined;
};

const emptyGroup = (): ConditionGroup => ({
  and: [
    { field: 'merchant_name', op: 'contains', value: '' }
  ]
});

const validateConditionTree = (node: ConditionNode): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const visit = (n: ConditionNode, path: string) => {
    if (isGroup(n)) {
      const keys = ['and', 'or'].filter(k => Array.isArray((n as any)[k]));
      if (keys.length === 0) {
        errors.push(`${path}: group must have 'and' or 'or'`);
        return;
      }
      const key = keys[0] as 'and' | 'or';
      const children = (n as any)[key] as ConditionNode[];
      if (!children || children.length === 0) {
        errors.push(`${path}: ${key} group must have at least one child`);
      } else {
        children.forEach((c, i) => visit(c, `${path}/${key}[${i}]`));
      }
    } else if (isLeaf(n)) {
      if (!n.field || !n.op || n.value === undefined || n.value === null) {
        errors.push(`${path}: condition must include field, op, and value`);
        return;
      }
      if (n.field === 'amount') {
        const num = typeof n.value === 'number' ? n.value : Number(n.value);
        if (isNaN(num)) {
          errors.push(`${path}: amount value must be a number`);
        }
      } else {
        if (n.op === 'in') {
          const arr = Array.isArray(n.value) ? n.value : String(n.value).split(',').map(s => s.trim()).filter(Boolean);
          if (arr.length === 0) {
            errors.push(`${path}: 'in' requires at least one value`);
          }
        } else {
          const s = typeof n.value === 'string' ? n.value : String(n.value);
          if (!s.length) {
            errors.push(`${path}: value must not be empty`);
          }
        }
      }
    } else {
      errors.push(`${path}: invalid node`);
    }
  };
  visit(node, 'root');
  return { valid: errors.length === 0, errors };
};

export const TransactionRules = () => {
  const [rules, setRules] = useState<TransactionRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionRule | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('OTHER');
  const [conditions, setConditions] = useState<ConditionNode>(emptyGroup());
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setCategory('OTHER');
    setConditions(emptyGroup());
  };

  const loadRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await apiService.getTransactionRules();
      setRules(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load rules');
      toast.error(e?.message || 'Failed to load rules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = async (rule: TransactionRule) => {
    try {
      const full = await apiService.getTransactionRule(rule.id).catch(() => rule);
      setEditing(full);
      setName(full.name || '');
      setCategory(full.personal_finance_category || 'OTHER');
      setConditions(full.conditions || emptyGroup());
      setOpen(true);
    } catch {
      setEditing(rule);
      setName(rule.name || '');
      setCategory(rule.personal_finance_category || 'OTHER');
      setConditions(rule.conditions || emptyGroup());
      setOpen(true);
    }
  };

  const onSubmit = async () => {
    const res = validateConditionTree(conditions);
    if (!res.valid) {
      toast.error(res.errors[0] || 'Invalid rule conditions');
      return;
    }
    const toBackend = (node: ConditionNode): ConditionNode => {
      if (isGroup(node)) {
        const key = node.and ? 'and' : 'or';
        const children = (node as any)[key] as ConditionNode[];
        return { [key]: children.map(toBackend) } as ConditionGroup;
      }
      if (isLeaf(node) && node.field === 'amount') {
        const v = typeof node.value === 'number' ? node.value : Number(node.value);
        const raw = -Number(v || 0);
        const map: Record<string, string> = { eq: 'eq', gt: 'lt', gte: 'lte', lt: 'gt', lte: 'gte' };
        const nextOp = map[String(node.op)] || node.op;
        return { ...node, op: nextOp as any, value: raw };
      }
      return node;
    };
    setSaving(true);
    try {
      if (editing) {
        const updated = await apiService.updateTransactionRule(editing.id, {
          name,
          personal_finance_category: category,
          conditions: toBackend(conditions),
        });
        setRules(rules.map(r => (r.id === updated.id ? updated : r)));
        toast.success('Rule updated');
      } else {
        const created = await apiService.createTransactionRule({
          name,
          personal_finance_category: category,
          conditions: toBackend(conditions),
        });
        setRules([created, ...rules]);
        toast.success('Rule created');
      }
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (rule: TransactionRule) => {
    const ok = window.confirm('Delete this rule?');
    if (!ok) return;
    try {
      await apiService.deleteTransactionRule(rule.id);
      setRules(rules.filter(r => r.id !== rule.id));
      toast.success('Rule deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete rule');
    }
  };

  const headerActions = (
    <div className="flex items-center space-x-2">
      <button
        onClick={async () => {
          try {
            setIsLoading(true);
            await apiService.triggerTransactionRules();
            toast.success('Rules triggered');
          } catch (e: any) {
            toast.error(e?.message || 'Failed to run rules');
          } finally {
            setIsLoading(false);
          }
        }}
        className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        <PlayCircle className="w-4 h-4" />
        <span>Run Rules</span>
      </button>
      <button
        onClick={openCreate}
        className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        <Plus className="w-4 h-4" />
        <span>New Rule</span>
      </button>
    </div>
  );

  const modalActions = (
    <>
      <button
        onClick={() => { setOpen(false); resetForm(); }}
        className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={saving}
        className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {editing ? 'Update' : 'Create'}
      </button>
    </>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Transaction Rules</CardTitle>
            {headerActions}
          </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-gray-600">Loading...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-600">{error}</div>
              ) : rules.length === 0 ? (
                <div className="py-8 text-center text-gray-600">No rules yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {rules.map(rule => (
                        <tr key={rule.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{rule.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{getCategoryLabelFromConstants(rule.personal_finance_category)}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{formatDateTimeLocal(rule.created_at || '')}</td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => openEdit(rule)}
                                className="inline-flex items-center space-x-1 px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700"
                            >
                              <Pencil className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => onDelete(rule)}
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md border border-gray-300 hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Modal open={open} title={editing ? 'Edit Rule' : 'New Rule'} onClose={() => setOpen(false)} actions={modalActions} size="lg">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Unique rule name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {PERSONAL_FINANCE_CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Conditions</label>
              <div className="rounded-md border border-blue-100 bg-blue-50 text-blue-800 p-3 text-sm mb-2">
                <div className="flex items-start space-x-2">
                  <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p>Rules match your transactions when the conditions evaluate to true. A condition checks a field using an operator and a value (for example: merchant_name contains “starbucks”). Groups combine multiple conditions:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">AND</span>: all child conditions must be true</li>
                      <li><span className="font-medium">OR</span>: any child condition can be true</li>
                    </ul>
                    <p>Use nested groups to express complex logic.</p>
                  </div>
                </div>
              </div>
              <ConditionsBuilder value={conditions} onChange={setConditions} />
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
