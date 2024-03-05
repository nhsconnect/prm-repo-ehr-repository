import { getUKTimestamp } from "../time";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { EhrTransferTracker } from "./dynamo-ehr-transfer-tracker";

// TODO: move new version of updateFragmentAndCreateItsParts to here