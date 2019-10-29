import {promises as fsPromises} from 'fs'
import uuid from 'uuid/v4'

const save = (data, nhsNumber) => {
    const directory = `./local-datastore/${nhsNumber}`;
    const fileName = `${directory}/${uuid()}`;
    return fsPromises.mkdir(directory, {recursive: true})
        .then(() => fsPromises.writeFile(fileName, data))
        .then(() => fileName);
};

export default save;