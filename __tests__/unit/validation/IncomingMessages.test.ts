import 'source-map-support/register';

import { isLeft, isRight } from 'fp-ts/lib/Either';

import { plNotification } from '../../../src/validation/IncomingMessages';

const goodInput = [
	{
		Type: 'Notification',
		MessageId: '5626515e-6695-5f30-8eb9-0877c45357d9',
		TopicArn: 'arn:aws:sns:eu-central-1:037408918343:notification-article',
		Message: '{"gtin": "4047225027944", "channel": "gkkXtraMetaAttributes", "action": "Article create"}',
		Timestamp: '2021-05-27T13:37:10.524Z',
		SignatureVersion: '1',
		Signature:
			'Yat65mwoYhHu2XvMWLiQtn1T8qi9WyuHE3yVRD20lnngbK9bNr+dHI2Nbwrjt2kr3R44FSQPc24B1jmA172GmxM1H+TIhka8owyU6YIXOJLHM7YBK720Kl59dhihMHo4re9gz+RUm+VmmRNw2LkAromKjqLjytcFkOvRjGjMTD46LWaTRPoC+qHx5LLHKFclhf6FUeFXHIN/Kxvu6SGTuURWTWS93GrUSsM64Jg35BkBQT0+CsZg2FzVepkCV6SOp1tVWrTUcUJmz8auKeJrTsFu/T269lLsqJ+P04P0MAHq9act9kFJNfds95zErqo+BbELHHZcStksyOMOMTA63w==',
		SigningCertURL: 'https://sns.eu-central-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem',
		UnsubscribeURL:
			'https://sns.eu-central-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-central-1:037408918343:notification-article:4ea17d74-9226-44e9-bf8d-797e82a56b8d',
	},
	{
		Type: 'Notification',
		MessageId: '9f6e30a0-7171-5de5-8083-6989d3c342a1',
		TopicArn: 'arn:aws:sns:eu-central-1:037408918343:notification-article',
		Message: '{"gtin": "4047225031514", "channel": "gkkXtraMetaAttributes", "action": "Article create"}',
		Timestamp: '2021-05-27T13:36:50.727Z',
		SignatureVersion: '1',
		Signature:
			'hoyCW+NRcosd3fXcWnnRo3jiQ8iqfvhOLPvwdrn28nSzgfFHzxz8lC0LaPOhEIDYXfhowTd0/AyzFNT7NeUDm+7VfHrVHAsWiGe++VUfpqpA/lWmVPZ47IjaUAgoXkImVf+c1u2HVHw/a8BsZORPUw7YNiTBEwMo2tTX/ScfEAIKpnjN0uEzrdsAblxUh8K/uemYEMdwM3N0NrcyL+4qULW9Nq1sHS4IpWmBV3sTHkilwt0hKNoC2Y441mxjpbAJT7xdZvzLprgt8BovFcuNoXm7jutJx7Zx+x0e5QKBs5Vbclr6XEuiXgcDdgcz1D5GPuAWd5gfXV9hql8ILktrkw==',
		SigningCertURL: 'https://sns.eu-central-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem',
		UnsubscribeURL:
			'https://sns.eu-central-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-central-1:037408918343:notification-article:4ea17d74-9226-44e9-bf8d-797e82a56b8d',
	},
];

const badInput = [
	// Other event
	{
		Type: 'SubscriptionConfirmation',
		MessageId: '7f777f75-27a1-4704-90ed-b2678e810ea9',
		Token: '2336412f37fb687f5d51e6e2425e90ccf48778401cc072fe61d28eced01bd8a5b703c00b93523a22b5c8335b00c7b533bbc651c4b87e644e86a9b9a5a95c72459660dd4693db7e012d972af318135e6ba827a984856e6dfd8e090edea0c79deafc3db41606bd7a13188da0ad06ff8dc3ab30ce3236b9cb9c9b5e388b236a5ffe',
		TopicArn: 'arn:aws:sns:eu-central-1:037408918343:notification-article',
		Message:
			'You have chosen to subscribe to the topic arn:aws:sns:eu-central-1:037408918343:notification-article.\nTo confirm the subscription, visit the SubscribeURL included in this message.',
		SubscribeURL:
			'https://sns.eu-central-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-central-1:037408918343:notification-article&Token=2336412f37fb687f5d51e6e2425e90ccf48778401cc072fe61d28eced01bd8a5b703c00b93523a22b5c8335b00c7b533bbc651c4b87e644e86a9b9a5a95c72459660dd4693db7e012d972af318135e6ba827a984856e6dfd8e090edea0c79deafc3db41606bd7a13188da0ad06ff8dc3ab30ce3236b9cb9c9b5e388b236a5ffe',
		Timestamp: '2021-05-26T19:23:51.587Z',
		SignatureVersion: '1',
		Signature:
			'PmrSSsGUmb9sRbSSldXYygQ0gC+NFba25ktRnspN30xQHWs4uLBffz9VfeP5Dqxv2CJws/gDLAM3wl/LCwG76D3butQLtJHm5sn80zm6rt4BwDNEtTFkvzg1vKjWf3CNCeImPFFP9mFLC21ri46yTAyGch/RCy1ORgpgRguOB7m+67f2YfctHJkk1ZaobE+J++ACb4PvCzsqbNesIfXHrxTbsAqGBHv+rn3Y1aZggESEfGu1ZYOa/BK4TU7MbthBPTK+hPp7j26sE4esZAGkdLldjmPcxrnmwLXgNLL3Mb6x189a/yAVB2EhssZeBL84TMESqC8BZpdWkpV9pQix0g==',
		SigningCertURL: 'https://sns.eu-central-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem',
	},
	// Broken JSON
	{
		Type: 'Notification',
		MessageId: '9f6e30a0-7171-5de5-8083-6989d3c342a1',
		TopicArn: 'arn:aws:sns:eu-central-1:037408918343:notification-article',
		Message: '{"gtin": "4047225031514", "channel": "gkkXtraMetaAttributes", action": "Article create"}',
		Timestamp: '2021-05-27T13:36:50.727Z',
		SignatureVersion: '1',
		Signature:
			'hoyCW+NRcosd3fXcWnnRo3jiQ8iqfvhOLPvwdrn28nSzgfFHzxz8lC0LaPOhEIDYXfhowTd0/AyzFNT7NeUDm+7VfHrVHAsWiGe++VUfpqpA/lWmVPZ47IjaUAgoXkImVf+c1u2HVHw/a8BsZORPUw7YNiTBEwMo2tTX/ScfEAIKpnjN0uEzrdsAblxUh8K/uemYEMdwM3N0NrcyL+4qULW9Nq1sHS4IpWmBV3sTHkilwt0hKNoC2Y441mxjpbAJT7xdZvzLprgt8BovFcuNoXm7jutJx7Zx+x0e5QKBs5Vbclr6XEuiXgcDdgcz1D5GPuAWd5gfXV9hql8ILktrkw==',
		SigningCertURL: 'https://sns.eu-central-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem',
		UnsubscribeURL:
			'https://sns.eu-central-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-central-1:037408918343:notification-article:4ea17d74-9226-44e9-bf8d-797e82a56b8d',
	},
	// gtin missing
	{
		Type: 'Notification',
		MessageId: '9f6e30a0-7171-5de5-8083-6989d3c342a1',
		TopicArn: 'arn:aws:sns:eu-central-1:037408918343:notification-article',
		Message: '{"channel": "gkkXtraMetaAttributes", "action": "Article create"}',
		Timestamp: '2021-05-27T13:36:50.727Z',
		SignatureVersion: '1',
		Signature:
			'hoyCW+NRcosd3fXcWnnRo3jiQ8iqfvhOLPvwdrn28nSzgfFHzxz8lC0LaPOhEIDYXfhowTd0/AyzFNT7NeUDm+7VfHrVHAsWiGe++VUfpqpA/lWmVPZ47IjaUAgoXkImVf+c1u2HVHw/a8BsZORPUw7YNiTBEwMo2tTX/ScfEAIKpnjN0uEzrdsAblxUh8K/uemYEMdwM3N0NrcyL+4qULW9Nq1sHS4IpWmBV3sTHkilwt0hKNoC2Y441mxjpbAJT7xdZvzLprgt8BovFcuNoXm7jutJx7Zx+x0e5QKBs5Vbclr6XEuiXgcDdgcz1D5GPuAWd5gfXV9hql8ILktrkw==',
		SigningCertURL: 'https://sns.eu-central-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem',
		UnsubscribeURL:
			'https://sns.eu-central-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-central-1:037408918343:notification-article:4ea17d74-9226-44e9-bf8d-797e82a56b8d',
	},
	// GTIN to short
	{
		Type: 'Notification',
		MessageId: '5626515e-6695-5f30-8eb9-0877c45357d9',
		TopicArn: 'arn:aws:sns:eu-central-1:037408918343:notification-article',
		Message: '{"gtin": "404722502794", "channel": "gkkXtraMetaAttributes", "action": "Article create"}',
		Timestamp: '2021-05-27T13:37:10.524Z',
		SignatureVersion: '1',
		Signature:
			'Yat65mwoYhHu2XvMWLiQtn1T8qi9WyuHE3yVRD20lnngbK9bNr+dHI2Nbwrjt2kr3R44FSQPc24B1jmA172GmxM1H+TIhka8owyU6YIXOJLHM7YBK720Kl59dhihMHo4re9gz+RUm+VmmRNw2LkAromKjqLjytcFkOvRjGjMTD46LWaTRPoC+qHx5LLHKFclhf6FUeFXHIN/Kxvu6SGTuURWTWS93GrUSsM64Jg35BkBQT0+CsZg2FzVepkCV6SOp1tVWrTUcUJmz8auKeJrTsFu/T269lLsqJ+P04P0MAHq9act9kFJNfds95zErqo+BbELHHZcStksyOMOMTA63w==',
		SigningCertURL: 'https://sns.eu-central-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem',
		UnsubscribeURL:
			'https://sns.eu-central-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-central-1:037408918343:notification-article:4ea17d74-9226-44e9-bf8d-797e82a56b8d',
	},
	// GTIN to long
	{
		Type: 'Notification',
		MessageId: '5626515e-6695-5f30-8eb9-0877c45357d9',
		TopicArn: 'arn:aws:sns:eu-central-1:037408918343:notification-article',
		Message: '{"gtin": "4047225027944444", "channel": "gkkXtraMetaAttributes", "action": "Article create"}',
		Timestamp: '2021-05-27T13:37:10.524Z',
		SignatureVersion: '1',
		Signature:
			'Yat65mwoYhHu2XvMWLiQtn1T8qi9WyuHE3yVRD20lnngbK9bNr+dHI2Nbwrjt2kr3R44FSQPc24B1jmA172GmxM1H+TIhka8owyU6YIXOJLHM7YBK720Kl59dhihMHo4re9gz+RUm+VmmRNw2LkAromKjqLjytcFkOvRjGjMTD46LWaTRPoC+qHx5LLHKFclhf6FUeFXHIN/Kxvu6SGTuURWTWS93GrUSsM64Jg35BkBQT0+CsZg2FzVepkCV6SOp1tVWrTUcUJmz8auKeJrTsFu/T269lLsqJ+P04P0MAHq9act9kFJNfds95zErqo+BbELHHZcStksyOMOMTA63w==',
		SigningCertURL: 'https://sns.eu-central-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem',
		UnsubscribeURL:
			'https://sns.eu-central-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-central-1:037408918343:notification-article:4ea17d74-9226-44e9-bf8d-797e82a56b8d',
	},
];

describe('Test io-ts Type - IncommingMessages:plNotification', () => {
	it('should parse valid Messages', () => {
		// Invoke exampleHandler()
		const results = goodInput.map((i) => ({
			input: i,
			result: plNotification.decode(i),
		}));

		const failures = results.filter((r) => isLeft(r.result));

		// Compare the result with the expected result
		expect(failures.length).toEqual(0);
	});

	it('should not parse invalid Messages', () => {
		// Invoke exampleHandler()
		const results = badInput.map((i) => ({
			input: i,
			result: plNotification.decode(i),
		}));

		// const passes = results.filter((r) => isLeft(r.result));
		// passes.forEach((res) => {
		// 	console.log(PathReporter.report(res.result));
		// });

		const failures = results.filter((r) => isRight(r.result));

		// Compare the result with the expected result
		expect(failures.length).toEqual(0);
	});
});
