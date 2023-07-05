import { readFileSync } from 'fs';
import path from 'path';

export const getHealthRecords = (
  completedAtDate,
  createdAtDate,
  updatedAtDate,
  deletedAtDate,
  getMultiple
) => {
  return JSON.parse(
    readFileSync(
      path.join(
        __dirname,
        'data',
        getMultiple ? 'multiple-health-records.json' : 'one-health-record.json'
      ),
      'utf-8'
    )
  ).map((message) => {
    message.completedAt = completedAtDate;
    message.createdAt = createdAtDate;
    message.updatedAt = updatedAtDate;
    message.deletedAt = deletedAtDate;

    return message;
  });
};
