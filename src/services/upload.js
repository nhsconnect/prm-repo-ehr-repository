import s3Save from './s3'
import fileSystemSave from './file-system'

const upload = (data) => {
    if (process.env.NODE_ENV === 'local') {
        return fileSystemSave(data)
    }

    return s3Save(data)
};

export default upload