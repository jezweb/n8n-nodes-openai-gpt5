import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';

export class OpenAiGpt5 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenAI GPT-5',
		name: 'openAiGpt5',
		icon: 'file:openai.svg',
		group: ['transform'],
		version: 1,
		subtitle: 'Process files with GPT-5',
		description: 'Process PDFs and images with OpenAI GPT-5',
		defaults: {
			name: 'OpenAI GPT-5',
		},
		inputs: ['main'] as any,
		outputs: ['main'] as any,
		credentials: [
			{
				name: 'openAiGpt5Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: 'Analyze these files and provide insights.',
				required: true,
				description: 'What you want GPT-5 to do with the files',
			},
			{
				displayName: 'PDF Files',
				name: 'pdfFiles',
				type: 'string',
				default: '',
				placeholder: 'file_abc123 or ["file_1", "file_2"] or {{ $json.pdfIds }}',
				description: 'PDF file IDs (upload PDFs first to get IDs). Single ID, array, or expression.',
			},
			{
				displayName: 'Images',
				name: 'imageFiles',
				type: 'string',
				default: '',
				placeholder: 'https://url.jpg or ["url1", "url2"] or {{ $json.images }}',
				description: 'Image URLs or file IDs. Single value, array, or expression.',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Model',
						name: 'model',
						type: 'options',
						options: [
							{
								name: 'GPT-4.1',
								value: 'gpt-4.1',
								description: 'Latest GPT-4.1 with 1M context',
							},
							{
								name: 'GPT-4.1 Mini',
								value: 'gpt-4.1-mini',
								description: 'Faster GPT-4.1 variant',
							},
							{
								name: 'GPT-4.1 Nano',
								value: 'gpt-4.1-nano',
								description: 'Fastest, cheapest model',
							},
							{
								name: 'GPT-5',
								value: 'gpt-5',
								description: 'Most capable GPT-5 model',
							},
							{
								name: 'GPT-5 Mini',
								value: 'gpt-5-mini',
								description: 'Smaller, faster GPT-5 variant',
							},
							{
								name: 'GPT-5 Nano',
								value: 'gpt-5-nano',
								description: 'Fastest, most efficient GPT-5',
							},
							{
								name: 'O3',
								value: 'o3',
								description: 'Advanced reasoning model',
							},
							{
								name: 'O3 Mini',
								value: 'o3-mini',
								description: 'Smaller O3 variant',
							},
						],
						default: 'gpt-5',
						description: 'The OpenAI model to use',
					},
					{
						displayName: 'Max Tokens',
						name: 'maxTokens',
						type: 'number',
						default: 4096,
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Reasoning Effort',
						name: 'reasoningEffort',
						type: 'options',
						options: [
							{
								name: 'Low',
								value: 'low',
								description: 'Faster responses',
							},
							{
								name: 'Medium',
								value: 'medium',
								description: 'Balanced (default)',
							},
							{
								name: 'High',
								value: 'high',
								description: 'Maximum reasoning',
							},
						],
						default: 'medium',
						description: 'Reasoning effort level',
					},
					{
						displayName: 'Reasoning Summary',
						name: 'reasoningSummary',
						type: 'options',
						options: [
							{
								name: 'None',
								value: 'none',
								description: 'No reasoning summary',
							},
							{
								name: 'Auto',
								value: 'auto',
								description: 'Let model decide',
							},
							{
								name: 'Concise',
								value: 'concise',
								description: 'Brief reasoning summary',
							},
							{
								name: 'Detailed',
								value: 'detailed',
								description: 'Full reasoning details',
							},
						],
						default: 'none',
						description: 'Include reasoning summary in response',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('openAiGpt5Api');
		const baseUrl = (credentials.baseUrl as string) || 'https://api.openai.com';

		// Helper function to parse file inputs
		const parseFileInput = (input: any): string[] => {
			if (!input) return [];
			
			// Already an array
			if (Array.isArray(input)) {
				return input.map(item => String(item).trim()).filter(item => item);
			}
			
			// String input
			if (typeof input === 'string') {
				const trimmed = input.trim();
				if (!trimmed) return [];
				
				// Check if it's a JSON array string
				if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
					try {
						const parsed = JSON.parse(trimmed);
						if (Array.isArray(parsed)) {
							return parsed.map(item => String(item).trim()).filter(item => item);
						}
					} catch (e) {
						// Not valid JSON, treat as string
					}
				}
				
				// Check if it's comma-separated
				if (trimmed.includes(',')) {
					return trimmed.split(',').map(s => s.trim()).filter(s => s);
				}
				// Single item
				return [trimmed];
			}
			
			// Other types - try to convert to string
			const str = String(input).trim();
			return str ? [str] : [];
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const prompt = this.getNodeParameter('prompt', i) as string;
				const pdfFiles = this.getNodeParameter('pdfFiles', i, '') as any;
				const imageFiles = this.getNodeParameter('imageFiles', i, '') as any;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;

				const model = options.model || 'gpt-5';

				// Build request body
				const requestBody: IDataObject = {
					model,
				};

				// Parse file inputs
				const pdfIds = parseFileInput(pdfFiles);
				const images = parseFileInput(imageFiles);

				// Build content array for requests with files
				const contentArray: IDataObject[] = [];

				// Add text first
				contentArray.push({
					type: 'input_text',
					text: prompt,
				});

				// Add PDF files
				for (const pdfId of pdfIds) {
					if (pdfId.startsWith('file_')) {
						contentArray.push({
							type: 'input_file',
							file_id: pdfId,
						});
					} else if (pdfId.includes('http://') || pdfId.includes('https://')) {
						// PDF URL
						contentArray.push({
							type: 'input_file',
							file_url: pdfId,
						});
					}
				}

				// Add images - fix the structure based on docs
				for (const image of images) {
					if (image.startsWith('file_')) {
						// File ID
						contentArray.push({
							type: 'input_image',
							file_id: image,
						});
					} else if (image.includes('http://') || image.includes('https://')) {
						// Image URL - corrected structure
						contentArray.push({
							type: 'input_image',
							image_url: image,
						});
					}
				}

				// Use array structure if we have files, otherwise simple string
				if (pdfIds.length > 0 || images.length > 0) {
					requestBody.input = [
						{
							role: 'user',
							content: contentArray,
						},
					];
				} else {
					// Text-only request - just the string
					requestBody.input = prompt;
				}

				// Add optional parameters
				if (options.maxTokens) {
					requestBody.max_tokens = options.maxTokens;
				}

				// Add reasoning configuration for supported models (GPT-5 and GPT-4.1 support reasoning)
				const modelStr = String(model);
				if ((options.reasoningEffort || options.reasoningSummary) && 
				    (modelStr.startsWith('gpt-5') || modelStr.startsWith('gpt-4.1'))) {
					const reasoning: IDataObject = {};
					
					if (options.reasoningEffort) {
						reasoning.effort = options.reasoningEffort;
					}
					
					if (options.reasoningSummary && options.reasoningSummary !== 'none') {
						reasoning.summary = options.reasoningSummary;
					}
					
					requestBody.reasoning = reasoning;
				}

				// Make API request
				const responseOptions: any = {
					method: 'POST',
					url: `${baseUrl}/v1/responses`,
					headers: {
						'Authorization': `Bearer ${credentials.apiKey}`,
						'Content-Type': 'application/json',
					} as any,
					body: requestBody,
					json: true,
				};

				if (credentials.organizationId) {
					responseOptions.headers['OpenAI-Organization'] = credentials.organizationId as string;
				}

				const response = await this.helpers.httpRequest(responseOptions);

				// Extract text from response - based on actual API docs
				let textContent = '';
				let reasoningSummary = null;
				
				// Primary structure from Responses API docs
				if (response.output_text) {
					textContent = response.output_text;
				}
				// Alternative structure with output array
				else if (response.output && Array.isArray(response.output)) {
					for (const output of response.output) {
						if (output.content && Array.isArray(output.content)) {
							for (const content of output.content) {
								if (content.type === 'output_text' && content.text) {
									textContent = content.text;
									break;
								}
							}
						}
						if (textContent) break;
					}
				}
				// Legacy fallback for chat completions
				else if (response.choices?.[0]?.message?.content) {
					textContent = response.choices[0].message.content;
				}
				
				// Extract reasoning summary if present
				if (response.reasoning && response.reasoning.summary) {
					reasoningSummary = response.reasoning.summary;
				}
				// Also check in the summary array structure from docs
				else if (response.summary && Array.isArray(response.summary)) {
					for (const summary of response.summary) {
						if (summary.type === 'summary_text' && summary.text) {
							reasoningSummary = summary.text;
							break;
						}
					}
				}

				const outputData: IDataObject = {
					text: textContent,
					model: response.model || model,
					usage: response.usage,
					pdfCount: pdfIds.length,
					imageCount: images.length,
				};
				
				// Add reasoning summary if it exists
				if (reasoningSummary) {
					outputData.reasoningSummary = reasoningSummary;
				}
				
				// Include full response for debugging
				outputData.fullResponse = response;

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(outputData),
					{ itemData: { item: i } }
				);
				returnData.push(...executionData);

			} catch (error: any) {
				// Error handling
				let errorMessage = 'Unknown error';
				let errorDetails: IDataObject = {};
				
				if (error.response) {
					errorMessage = error.response.statusText || `HTTP ${error.response.status}`;
					if (error.response.body) {
						errorDetails = error.response.body;
						if (error.response.body.error) {
							errorMessage = error.response.body.error.message || errorMessage;
						}
					}
				} else if (error.message) {
					errorMessage = error.message;
				}

				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({
							error: errorMessage,
							details: errorDetails,
						}),
						{ itemData: { item: i } }
					);
					returnData.push(...executionData);
					continue;
				}

				const nodeError = new NodeOperationError(
					this.getNode(),
					errorMessage,
					{
						description: (errorDetails.error as any)?.message || undefined,
					}
				);
				throw nodeError;
			}
		}

		return [returnData];
	}
}