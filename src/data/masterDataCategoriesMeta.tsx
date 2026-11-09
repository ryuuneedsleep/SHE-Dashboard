import React from 'react';
import type { MasterDataCategory } from '../types/masterData';
import {
  Building2,
  Layers,
  Briefcase,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Flame,
  Wrench,
  Activity,
} from 'lucide-react';

export interface CategoryMeta {
  key: MasterDataCategory;
  title: string;
  subtitle: string;
  group: 'organizational' | 'safety';
  icon: React.ReactNode;
}

export const CATEGORIES_META: CategoryMeta[] = [
  // Organizational Master Data
  {
    key: 'departments',
    title: 'Department',
    subtitle: 'Manage core logistics and division departments (6 initial fixtures).',
    group: 'organizational',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    key: 'sections',
    title: 'Section / Area',
    subtitle: 'Organizational sections associated with specific departments.',
    group: 'organizational',
    icon: <Layers className="w-4 h-4" />,
  },
  {
    key: 'positions',
    title: 'Position / Jabatan',
    subtitle: 'Designated employee position classifications across the division.',
    group: 'organizational',
    icon: <Briefcase className="w-4 h-4" />,
  },
  {
    key: 'operational_areas',
    title: 'Operational Area',
    subtitle: 'Physical warehouse zones, gates, and bays used for user Area Access.',
    group: 'organizational',
    icon: <MapPin className="w-4 h-4" />,
  },

  // Safety Master Data
  {
    key: 'safety_categories',
    title: 'Safety Category',
    subtitle: 'Classify safety activities, patrols, and observation routines.',
    group: 'safety',
    icon: <Activity className="w-4 h-4" />,
  },
  {
    key: 'hazard_categories',
    title: 'Hazard Category',
    subtitle: 'Potential hazard sources (physical, chemical, ergonomic, etc.).',
    group: 'safety',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    key: 'finding_categories',
    title: 'Finding Category',
    subtitle: 'Observation outcomes (Unsafe Condition, Unsafe Action, Kaizen).',
    group: 'safety',
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    key: 'risk_levels',
    title: 'Risk Level',
    subtitle: 'Configurable risk ranks with customizable display colors and sorting.',
    group: 'safety',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    key: 'incident_types',
    title: 'Incident Type',
    subtitle: 'Types of safety occurrences (Near Miss, First Aid, Damage, etc.).',
    group: 'safety',
    icon: <Flame className="w-4 h-4" />,
  },
  {
    key: 'corrective_action_categories',
    title: 'Corrective Action',
    subtitle: 'Remediation categories (Engineering, Administrative, Training, PPE).',
    group: 'safety',
    icon: <Wrench className="w-4 h-4" />,
  },
];

