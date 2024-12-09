'use client';

interface TabNavigationProps {
  activeTab: 'class' | '2345' | 'one-on-one';
  onTabChange: (tab: 'class' | '2345' | 'one-on-one') => void;
  type: 'student' | 'operation';
}

export default function TabNavigation({ activeTab, onTabChange, type }: TabNavigationProps) {
  return (
    <div className="mb-4 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          onClick={() => onTabChange('class')}
          className={`${
            activeTab === 'class'
              ? 'border-[#fc5d01] text-[#fc5d01]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          {type === 'student' ? 'Class Students' : 'Class Fees'}
        </button>
        <button
          onClick={() => onTabChange('2345')}
          className={`${
            activeTab === '2345'
              ? 'border-[#fc5d01] text-[#fc5d01]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          {type === 'student' ? '2345 Students' : '2345 Fees'}
        </button>
        <button
          onClick={() => onTabChange('one-on-one')}
          className={`${
            activeTab === 'one-on-one'
              ? 'border-[#fc5d01] text-[#fc5d01]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          {type === 'student' ? '1-1 Students' : '1-1 Fees'}
        </button>
      </nav>
    </div>
  );
}
