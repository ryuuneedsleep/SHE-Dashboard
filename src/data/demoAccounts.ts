import type { AccountStatus, AppRole } from '../types/auth';

export interface DemoAccount {
  name: string;
  noreg: string;
  email: string;
  pass: string;
  dept: string;
  pos: string;
  role: AppRole;
  status: AccountStatus;
  desc: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Budi Santoso',
    noreg: 'TAM-8801',
    email: 'budi.santoso@toyota.co.id',
    pass: 'Toyota@2026',
    dept: 'QSHE & Jiritsuka',
    pos: 'Staff',
    role: 'QSHE_ADMIN',
    status: 'Active',
    desc: 'Super Admin: User & role management, registration approvals, area access.',
  },
  {
    name: 'Siti Rahma',
    noreg: 'TAM-8806',
    email: 'siti.rahma@toyota.co.id',
    pass: 'Toyota@2026',
    dept: 'QSHE & Jiritsuka',
    pos: 'Section Head',
    role: 'QSHE_ADMIN',
    status: 'Active',
    desc: 'Co-Admin: Use to test demoting/suspending one admin while protecting the last admin.',
  },
  {
    name: 'Hendra Gunawan',
    noreg: 'TAM-8807',
    email: 'hendra.gunawan@toyota.co.id',
    pass: 'Toyota@2026',
    dept: 'Warehouse',
    pos: 'Line Head',
    role: 'APPROVER',
    status: 'Active',
    desc: 'Approver / Leader: Verifies hazard reports and corrective actions within assigned areas.',
  },
  {
    name: 'Siti Aminah',
    noreg: 'TAM-8808',
    email: 'siti.aminah@toyota.co.id',
    pass: 'Toyota@2026',
    dept: 'Warehouse',
    pos: 'Operator',
    role: 'MEMBER',
    status: 'Active',
    desc: 'Member / Reporter: Floor inspections, hazard logging, 5S checks.',
  },
  {
    name: 'Bambang Soediro',
    noreg: 'TAM-8809',
    email: 'bambang.soediro@toyota.co.id',
    pass: 'Toyota@2026',
    dept: 'SM',
    pos: 'Department Head / Manager',
    role: 'MANAGEMENT',
    status: 'Active',
    desc: 'Management: Executive overview of division-wide safety KPI dashboards.',
  },
  {
    name: 'Agus Pratama',
    noreg: 'TAM-8802',
    email: 'agus.pratama@toyota.co.id',
    pass: 'Toyota@2026',
    dept: 'Warehouse',
    pos: 'Operator',
    role: 'MEMBER',
    status: 'Pending',
    desc: 'Pending approval in QSHE Admin queue; operational access locked.',
  },
  {
    name: 'Rian Hidayat',
    noreg: 'TAM-8803',
    email: 'rian.hidayat@toyota.co.id',
    pass: 'Toyota@2026',
    dept: 'IM',
    pos: 'Operator',
    role: 'MEMBER',
    status: 'Rejected',
    desc: 'Registration rejected by administrator; displays status details.',
  },
  {
    name: 'Dewi Lestari',
    noreg: 'TAM-8804',
    email: 'dewi.lestari@toyota.co.id',
    pass: 'Toyota@2026',
    dept: 'SPPM',
    pos: 'Staff',
    role: 'APPROVER',
    status: 'Suspended',
    desc: 'Temporarily suspended due to compliance review.',
  },
  {
    name: 'Fajar Nugraha',
    noreg: 'TAM-8805',
    email: 'fajar.nugraha@toyota.co.id',
    pass: 'Toyota@2026',
    dept: 'SM',
    pos: 'Group Head',
    role: 'MANAGEMENT',
    status: 'Inactive',
    desc: 'Deactivated former personnel record.',
  },
];
