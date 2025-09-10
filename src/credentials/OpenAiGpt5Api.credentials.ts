import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OpenAiGpt5Api implements ICredentialType {
	name = 'openAiGpt5Api';
	displayName = 'OpenAI GPT-5 API';
	documentationUrl = 'https://platform.openai.com/docs/api-reference';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			placeholder: 'sk-...',
			description: 'Your OpenAI API key',
		},
		{
			displayName: 'Organization ID',
			name: 'organizationId',
			type: 'string',
			default: '',
			description: 'Optional OpenAI Organization ID',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.openai.com',
			description: 'The base URL for the OpenAI API',
		},
	];
}