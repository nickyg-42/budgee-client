import { useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import type { ConditionNode, ConditionGroup, ConditionLeaf, TransactionRuleField, StringOperator, NumberOperator } from '../../types';
import { cn } from '../../utils/cn';
import { X, PlusCircle, FolderTree, ListFilter } from 'lucide-react';
import { MinimalSelect } from '../ui/MinimalSelect';

interface ConditionsBuilderProps {
  value: ConditionNode;
  onChange: (next: ConditionNode) => void;
  disabled?: boolean;
}

const stringFields: TransactionRuleField[] = ['name', 'merchant_name', 'account'];
const numberFields: TransactionRuleField[] = ['amount'];
const stringOps: StringOperator[] = ['equals', 'contains', 'in'];
const numberOps: NumberOperator[] = ['equals', 'gte', 'lte', 'gt', 'lt'];
const numberOpLabels: Record<NumberOperator, string> = {
  equals: 'Equal to',
  gte: 'Greater than or equal to',
  lte: 'Less than or equal to',
  gt: 'Greater than',
  lt: 'Less than',
};

const isGroup = (node: ConditionNode): node is ConditionGroup => {
  return typeof node === 'object' && (Array.isArray((node as any).and) || Array.isArray((node as any).or));
};

const isLeaf = (node: ConditionNode): node is ConditionLeaf => {
  return typeof node === 'object' && (node as any).field !== undefined;
};

const emptyLeaf = (): ConditionLeaf => ({
  field: 'merchant_name',
  op: 'contains',
  value: '',
});

const emptyGroup = (op: 'and' | 'or' = 'and'): ConditionGroup => ({
  [op]: [emptyLeaf()],
});

const normalizeValue = (field: TransactionRuleField, op: StringOperator | NumberOperator, raw: string): string | number | string[] => {
  if (field === 'amount') {
    return raw;
  }
  if (op === 'in') {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return raw;
};

const GroupEditor = ({ node, onChange, disabled }: { node: ConditionGroup; onChange: (next: ConditionGroup) => void; disabled?: boolean }) => {
  const op = useMemo<'and' | 'or'>(() => (node.and ? 'and' : 'or'), [node]);
  const children = node[op] || [];

  const setOp = (nextOp: 'and' | 'or') => {
    const next: ConditionGroup = { [nextOp]: children };
    onChange(next);
  };

  const updateChild = (index: number, child: ConditionNode) => {
    const nextChildren = children.slice();
    nextChildren[index] = child;
    onChange({ [op]: nextChildren });
  };

  const addLeaf = () => {
    onChange({ [op]: [...children, emptyLeaf()] });
  };

  const addGroup = () => {
    onChange({ [op]: [...children, emptyGroup('and')] });
  };

  const removeChild = (index: number) => {
    const nextChildren = children.filter((_, i) => i !== index);
    onChange({ [op]: nextChildren.length ? nextChildren : [emptyLeaf()] });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <MinimalSelect
          size="sm"
          value={op}
          onChange={(e) => setOp(e.target.value as 'and' | 'or')}
          disabled={disabled}
          className="w-auto"
        >
          <option value="and">AND group</option>
          <option value="or">OR group</option>
        </MinimalSelect>
        <button
          type="button"
          onClick={addLeaf}
          disabled={disabled}
          className="flex items-center space-x-1 px-2 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
        >
          <ListFilter className="w-4 h-4" />
          <span>Add condition</span>
        </button>
        <button
          type="button"
          onClick={addGroup}
          disabled={disabled}
          className="flex items-center space-x-1 px-2 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
        >
          <FolderTree className="w-4 h-4" />
          <span>Add group</span>
        </button>
      </div>
      <div className="space-y-2">
        {children.map((child, idx) => (
          <div key={idx} className="pl-4 border-l-2 border-gray-200">
            <div className="flex items-start">
              <div className="flex-1">
                <ConditionsBuilder
                  value={child}
                  onChange={(next) => updateChild(idx, next)}
                  disabled={disabled}
                />
              </div>
              <button
                type="button"
                onClick={() => removeChild(idx)}
                disabled={disabled}
                className="ml-2 p-1 text-gray-600 hover:text-red-600 rounded-md hover:bg-gray-100"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LeafEditor = ({ node, onChange, disabled }: { node: ConditionLeaf; onChange: (next: ConditionLeaf) => void; disabled?: boolean }) => {
  const fieldIsString = stringFields.includes(node.field);
  const opOptions = fieldIsString ? stringOps : numberOps;

  const setField = (field: TransactionRuleField) => {
    const nextOp: StringOperator | NumberOperator = stringFields.includes(field) ? 'contains' : 'equals';
    const nextValue = stringFields.includes(field) ? '' : 0;
    onChange({ field, op: nextOp, value: nextValue });
  };

  const setOp = (op: StringOperator | NumberOperator) => {
    const nextValue = op === 'in' ? [] : node.value;
    onChange({ ...node, op, value: nextValue });
  };

  const setValue = (raw: string) => {
    const next = normalizeValue(node.field, node.op, raw);
    onChange({ ...node, value: next });
  };

  return (
    <div className="flex items-center space-x-2 w-full">
      <MinimalSelect
        size="sm"
        className="w-auto"
        value={node.field}
        onChange={(e) => setField(e.target.value as TransactionRuleField)}
        disabled={disabled}
      >
        {(['name','merchant_name','amount','account'] as TransactionRuleField[]).map(f => (
          <option key={f} value={f}>{f}</option>
        ))}
      </MinimalSelect>
      <MinimalSelect
        size="sm"
        className="w-auto"
        value={node.op as string}
        onChange={(e) => setOp(e.target.value as any)}
        disabled={disabled}
      >
        {opOptions.map(o => {
          const label = fieldIsString ? o : numberOpLabels[o as NumberOperator];
          return <option key={o} value={o}>{label}</option>;
        })}
      </MinimalSelect>
      {node.op === 'in' ? (
        <input
          type="text"
          className="border border-gray-300 rounded-md px-2 py-1 text-sm flex-1 min-w-0"
          placeholder="val1, val2, val3"
          value={Array.isArray(node.value) ? (node.value as string[]).join(', ') : ''}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
        />
      ) : node.field === 'amount' ? (
        <input
          type="text"
          inputMode="decimal"
          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-28 flex-shrink-0"
          value={typeof node.value === 'number' ? String(node.value) : String((node.value as string) || '')}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="-123.45"
        />
      ) : (
        <input
          type="text"
          className="border border-gray-300 rounded-md px-2 py-1 text-sm flex-1 min-w-0"
          value={typeof node.value === 'string' ? node.value : ''}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export const ConditionsBuilder = ({ value, onChange, disabled }: ConditionsBuilderProps) => {
  const content = isGroup(value) ? (
    <GroupEditor node={value} onChange={(next) => onChange(next)} disabled={disabled} />
  ) : isLeaf(value) ? (
    <LeafEditor node={value} onChange={(next) => onChange(next)} disabled={disabled} />
  ) : (
    <GroupEditor node={emptyGroup('and')} onChange={(next) => onChange(next)} disabled={disabled} />
  );

  return (
    <Card className="border-blue-100 w-full">
      <CardContent className={cn('space-y-4 w-full max-w-full')}>
        {content}
        {/* <div>
          <div className="text-xs text-gray-500 mb-1">Preview</div>
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded-md p-2 overflow-x-auto max-h-40">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div> */}
      </CardContent>
    </Card>
  );
};
