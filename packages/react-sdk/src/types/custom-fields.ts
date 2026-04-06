/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Custom field types for per-posting dynamic form definitions.
 */

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'url'
  | 'number'
  | 'boolean';

export interface CustomFieldDefinition {
  readonly id: string;
  readonly label: string;
  readonly type: CustomFieldType;
  readonly required: boolean;
  readonly placeholder?: string;
  readonly options?: readonly string[];
}
