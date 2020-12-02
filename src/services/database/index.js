import { checkDbHealth } from './check-db-health';
import { persistHealthRecord } from './persist-health-record';
import {
  retrieveHealthRecord,
  markHealthRecordAsCompleted,
  markHealthRecordFragmentsAsCompleted,
  markHealthRecordManifestAsCompleted,
  getCurrentHealthRecordForPatient
} from './health-record-repository';

export { checkDbHealth };
export { persistHealthRecord };
export {
  retrieveHealthRecord,
  markHealthRecordAsCompleted,
  markHealthRecordFragmentsAsCompleted,
  markHealthRecordManifestAsCompleted,
  getCurrentHealthRecordForPatient
};
