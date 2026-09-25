import React from 'react';
import { Title } from '@ui5/webcomponents-react';
import { SP } from '../constants';

const SectionHead: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    paddingTop: SP.l,
    paddingBottom: SP.s,
    paddingLeft: 0,
    paddingRight: 0,
    borderBottom: '1px solid var(--sapList_BorderColor)',
    marginBottom: SP.m,
  }}>
    <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>{title}</Title>
  </div>
);

export default SectionHead;
