import AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

import { InvalidParameterValueError } from '../errors';

const stepfunctions = new AWS.StepFunctions();

export async function sendTaskSuccess(
	output: Record<string, unknown>,
	taskToken: string,
): Promise<PromiseResult<AWS.StepFunctions.SendTaskSuccessOutput, AWS.AWSError>> {
	if (output == null || typeof taskToken !== 'string' || taskToken.length === 0)
		throw new InvalidParameterValueError('Null or empty required arguments');

	return stepfunctions
		.sendTaskSuccess({
			output: JSON.stringify(output),
			taskToken: taskToken,
		})
		.promise();
}
