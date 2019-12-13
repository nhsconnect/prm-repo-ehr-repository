import s3Save from '../storage/s3';
import fileSystemSave from '../storage/file-system';
import { save as dbSave } from '../storage/db';

const upload = (data, nhsNumber) => {
  if (process.env.NODE_ENV === 'local') {
    return fileSystemSave(data, nhsNumber).then(path => dbSave(nhsNumber, path));
  }

  return s3Save(data, nhsNumber).then(key => dbSave(nhsNumber, key));
};

export default upload;
