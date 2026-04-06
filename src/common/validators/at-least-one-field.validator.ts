/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Class-level class-validator constraint that requires at least one named field to be present.
 */
import {
  registerDecorator,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidationOptions,
  type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'AtLeastOneField', async: false })
export class AtLeastOneFieldConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const [fields] = args.constraints as [readonly string[]];
    const target = args.object as Record<string, unknown>;
    for (const field of fields) {
      if (target[field] !== undefined && target[field] !== null) {
        return true;
      }
    }
    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    const [fields] = args.constraints as [readonly string[]];
    return `At least one of the following fields is required: ${fields.join(', ')}`;
  }
}

export function AtLeastOneField(
  fields: readonly string[],
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (target: object, propertyName: string | symbol): void {
    const options: ValidationOptions = validationOptions ?? {};
    registerDecorator({
      name: 'AtLeastOneField',
      target: target.constructor,
      propertyName: propertyName as string,
      constraints: [fields],
      options,
      validator: AtLeastOneFieldConstraint,
    });
  };
}
