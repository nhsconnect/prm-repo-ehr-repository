import { readFileSync } from 'fs';
import path from 'path';

export const getHealthRecords = (date, getMultiple) => {
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
    message.completedAt = date;
    message.createdAt = date;
    message.updatedAt = date;
    message.deletedAt = date;

    return message;
  });
};
