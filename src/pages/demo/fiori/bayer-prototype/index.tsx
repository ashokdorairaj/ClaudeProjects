import React, { useState } from 'react';
import BayerListPage from './BayerListPage';
import BayerObjectPage from './BayerObjectPage';
import { type BayerCustomer } from './data';

const BayerV2Page: React.FC = () => {
  const [selected, setSelected] = useState<BayerCustomer | null>(null);

  if (selected) {
    return <BayerObjectPage customer={selected} onBack={() => setSelected(null)} />;
  }

  return <BayerListPage onSelectCustomer={setSelected} />;
};

export default BayerV2Page;
