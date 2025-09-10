import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	INodeExecutionData,
	NodeOperationError,
	IHttpRequestOptions,
} from 'n8n-workflow';

export class OpenAiGpt5 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenAI GPT-5',
		name: 'openAiGpt5',
		icon: 'file:openai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Process PDFs and other files with OpenAI GPT-5 using the Responses API',
		defaults: {
			name: 'OpenAI GPT-5',
		},
		inputs: ['main'] as any,
		outputs: ['main'] as any,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore - TypeScript doesn't recognize usableAsTool but it's needed for AI tool usage
		usableAsTool: true,
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Document Processing', 'Reasoning', 'Analysis'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/jezweb/n8n-nodes-openai-gpt5',
					},
				],
			},
		},
		credentials: [
			{
				name: 'openAiGpt5Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'AI Tool Mode',
						value: 'aiToolMode',
						description: 'Simplified mode for AI Agent usage - process text or files',
						action: 'Process text or files in AI tool mode',
					},
					{
						name: 'Upload & Process PDF',
						value: 'uploadAndProcess',
						description: 'Upload a PDF and process it with GPT-5',
						action: 'Upload a PDF and process it with GPT-5',
					},
					{
						name: 'Process with File ID',
						value: 'processFileId',
						description: 'Process a previously uploaded file using its ID',
						action: 'Process a previously uploaded file using its ID',
					},
				],
				default: 'uploadAndProcess',
			},
			// AI Tool Mode fields
			{
				displayName: 'Prompt',
				name: 'aiToolPrompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['aiToolMode'],
					},
				},
				description: 'The prompt to send to GPT-5. Can reference files if provided.',
			},
			{
				displayName: 'Include File',
				name: 'aiToolIncludeFile',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['aiToolMode'],
					},
				},
				description: 'Whether to include a file (PDF, image, etc.) with the request',
			},
			{
				displayName: 'File Binary Property',
				name: 'aiToolBinaryProperty',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['aiToolMode'],
						aiToolIncludeFile: [true],
					},
				},
				description: 'Name of the binary property containing the file',
			},
			// Upload & Process operation fields
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['uploadAndProcess'],
					},
				},
				options: [
					{
						name: 'Binary Data',
						value: 'binary',
						description: 'Use binary data from previous node (e.g., from S3 or Read Binary File)',
					},
					{
						name: 'File URL',
						value: 'url',
						description: 'Download file from URL (Google Drive, S3 signed URL, etc.)',
					},
					{
						name: 'File Path',
						value: 'filePath',
						description: 'Specify a file path on the server',
					},
				],
				default: 'binary',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadAndProcess'],
						inputType: ['binary'],
					},
				},
				description: 'Name of the binary property containing the PDF file',
			},
			{
				displayName: 'File URL',
				name: 'fileUrl',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadAndProcess'],
						inputType: ['url'],
					},
				},
				placeholder: 'https://example.com/file.pdf',
				description: 'URL to download the file from (supports direct download links, signed URLs, etc.)',
			},
			{
				displayName: 'File Path',
				name: 'filePath',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadAndProcess'],
						inputType: ['filePath'],
					},
				},
				placeholder: '/path/to/file.pdf',
				description: 'Path to the PDF file on the server',
			},
			// Process with File ID fields
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['processFileId'],
					},
				},
				placeholder: 'file_abc123...',
				// eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-id, n8n-nodes-base/node-param-description-miscased-json
				description: 'The file ID returned from a previous upload (e.g., {{ $json.id }})',
			},
			// Common fields for both operations
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: 'Analyze this document and provide a summary.',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadAndProcess', 'processFileId'],
					},
				},
				description: 'The prompt to send to GPT-5 for processing the file',
			},
			{
				displayName: 'Simplify Output',
				name: 'simplifyOutput',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
				displayOptions: {
					show: {
						operation: ['uploadAndProcess', 'processFileId'],
					},
				},
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['uploadAndProcess', 'processFileId'],
					},
				},
				// eslint-disable-next-line n8n-nodes-base/node-param-collection-type-unsorted-items
				options: [
					{
						displayName: 'Additional Files',
						name: 'additionalFiles',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								name: 'files',
								displayName: 'Files',
								values: [
									{
										displayName: 'File Source',
										name: 'fileSource',
										type: 'options',
										options: [
											{
												name: 'File ID',
												value: 'fileId',
											},
											{
												name: 'URL',
												value: 'url',
											},
										],
										default: 'url',
									},
									{
										displayName: 'File ID',
										name: 'fileId',
										type: 'string',
										displayOptions: {
											show: {
												fileSource: ['fileId'],
											},
										},
										default: '',
										placeholder: 'file_img_...',
									},
									{
										displayName: 'File URL',
										name: 'url',
										type: 'string',
										displayOptions: {
											show: {
												fileSource: ['url'],
											},
										},
										default: '',
										placeholder: 'https://example.com/file.pdf',
									},
								],
							},
						],
						description: 'Additional files (PDFs, images, etc.) to include in the request',
					},
					{
						displayName: 'Max Tokens',
						name: 'maxTokens',
						type: 'number',
						default: 4096,
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Model',
						name: 'model',
						type: 'options',
						options: [
							{
								name: 'GPT-4.1',
								value: 'gpt-4.1',
								description: 'GPT-4.1 model',
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
								description: 'Smallest, fastest GPT-5 variant',
							},
							{
								name: 'O3',
								value: 'o3',
								description: 'Advanced reasoning model',
							},
							{
								name: 'O3 Mini',
								value: 'o3-mini',
								description: 'Smaller, faster O3 variant',
							},
							{
								name: 'O3 Pro',
								value: 'o3-pro',
								description: 'Enhanced O3 with better reasoning',
							},
							{
								name: 'O4 Mini',
								value: 'o4-mini',
								description: 'Latest mini reasoning model',
							},
						],
						default: 'gpt-5',
						description: 'The OpenAI model to use',
					},
					{
						displayName: 'Purpose',
						name: 'purpose',
						type: 'string',
						default: 'user_data',
						description: 'Purpose for file upload (required by OpenAI)',
					},
					{
						displayName: 'Reasoning Effort',
						name: 'reasoningEffort',
						type: 'options',
						options: [
							{
								name: 'Low',
								value: 'low',
								description: 'Lower reasoning effort for faster responses',
							},
							{
								name: 'Medium',
								value: 'medium',
								description: 'Balanced reasoning and speed (default)',
							},
							{
								name: 'High',
								value: 'high',
								description: 'Maximum reasoning capability',
							},
							{
								name: 'Minimal',
								value: 'minimal',
								description: 'Minimal reasoning tokens for fastest responses (GPT-5 only)',
							},
						],
						default: 'medium',
						description: 'Reasoning effort level for enhanced model reasoning',
						displayOptions: {
							show: {
								model: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'o3', 'o3-pro', 'o3-mini', 'o4-mini'],
							},
						},
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
								description: 'Automatic summary generation',
							},
							{
								name: 'Detailed',
								value: 'detailed',
								description: 'Detailed reasoning summary',
							},
						],
						default: 'none',
						description: 'Request summaries of model reasoning (not guaranteed for every request)',
						displayOptions: {
							show: {
								model: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'o3', 'o3-pro', 'o3-mini'],
							},
						},
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 2,
							numberPrecision: 1,
						},
						default: 0.7,
						description: 'Controls randomness (Not supported by GPT-5 reasoning models - will be ignored)',
					},
					{
						displayName: 'Verbosity',
						name: 'verbosity',
						type: 'options',
						options: [
							{
								name: 'Low',
								value: 'low',
								description: 'Most concise output',
							},
							{
								name: 'Medium',
								value: 'medium',
								description: 'Balanced verbosity',
							},
							{
								name: 'High',
								value: 'high',
								description: 'More detailed output',
							},
						],
						default: 'medium',
						description: 'Control how concise the model output will be (GPT-5 only)',
						displayOptions: {
							show: {
								model: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'],
							},
						},
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
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let fileId: string;
				let prompt: string;
				let simplifyOutput: boolean;
				let additionalOptions: IDataObject;

				// Handle AI Tool Mode
				if (operation === 'aiToolMode') {
					prompt = this.getNodeParameter('aiToolPrompt', i) as string;
					simplifyOutput = true; // Always simplify for AI tool usage
					additionalOptions = {
						model: 'gpt-5',
						reasoningEffort: 'medium',
						verbosity: 'medium',
					};

					const includeFile = this.getNodeParameter('aiToolIncludeFile', i) as boolean;
					if (includeFile) {
						const binaryProperty = this.getNodeParameter('aiToolBinaryProperty', i) as string;
						const binaryData = this.helpers.assertBinaryData(i, binaryProperty);
						const fileBuffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);
						const fileName = binaryData.fileName || 'document';
						
						// Upload file to OpenAI
						// eslint-disable-next-line @typescript-eslint/no-var-requires
						const FormData = require('form-data');
						const formData = new FormData();
						formData.append('file', fileBuffer, {
							filename: fileName,
							contentType: binaryData.mimeType || 'application/octet-stream',
						});
						formData.append('purpose', 'user_data');

						const uploadOptions: IHttpRequestOptions = {
							method: 'POST',
							url: `${baseUrl}/v1/files`,
							headers: {
								'Authorization': `Bearer ${credentials.apiKey}`,
								...formData.getHeaders(),
							},
							body: formData,
						};

						if (credentials.organizationId) {
							uploadOptions.headers!['OpenAI-Organization'] = credentials.organizationId as string;
						}

						const uploadResponse = await this.helpers.httpRequest(uploadOptions);
						fileId = uploadResponse.id;
					}
				} else {
					// Original operation handling
					prompt = this.getNodeParameter('prompt', i) as string;
					simplifyOutput = this.getNodeParameter('simplifyOutput', i) as boolean;
					additionalOptions = this.getNodeParameter('additionalOptions', i) as IDataObject;
				}

				// Step 1: Handle file upload if needed
				if (operation === 'uploadAndProcess') {
					const inputType = this.getNodeParameter('inputType', i) as string;
					let fileBuffer: Buffer;
					let fileName: string;

					if (inputType === 'binary') {
						const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
						const binaryData = this.helpers.assertBinaryData(i, binaryProperty);
						fileBuffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);
						fileName = binaryData.fileName || 'document.pdf';
					} else if (inputType === 'url') {
						// Download file from URL
						const fileUrl = this.getNodeParameter('fileUrl', i) as string;
						const downloadResponse = await this.helpers.httpRequest({
							method: 'GET',
							url: fileUrl,
							encoding: 'arraybuffer',
							returnFullResponse: true,
						});
						fileBuffer = Buffer.from(downloadResponse.body as ArrayBuffer);
						// Try to extract filename from URL or Content-Disposition header
						const urlParts = fileUrl.split('/');
						fileName = urlParts[urlParts.length - 1].split('?')[0] || 'document.pdf';
						if (downloadResponse.headers && downloadResponse.headers['content-disposition']) {
							const match = downloadResponse.headers['content-disposition'].match(/filename="?([^";\s]+)"?/i);
							if (match) {
								fileName = match[1];
							}
						}
					} else {
						// File path - would need to read the file
						const filePath = this.getNodeParameter('filePath', i) as string;
						// eslint-disable-next-line @typescript-eslint/no-var-requires
						const fs = require('fs').promises;
						fileBuffer = await fs.readFile(filePath);
						fileName = filePath.split('/').pop() || 'document.pdf';
					}

					// Create multipart form data
					// eslint-disable-next-line @typescript-eslint/no-var-requires
					const FormData = require('form-data');
					const formData = new FormData();
					formData.append('file', fileBuffer, {
						filename: fileName,
						contentType: 'application/pdf',
					});
					formData.append('purpose', additionalOptions.purpose || 'user_data');

					// Upload file to OpenAI
					const uploadOptions: IHttpRequestOptions = {
						method: 'POST',
						url: `${baseUrl}/v1/files`,
						headers: {
							'Authorization': `Bearer ${credentials.apiKey}`,
							...formData.getHeaders(),
						},
						body: formData,
					};

					if (credentials.organizationId) {
						uploadOptions.headers!['OpenAI-Organization'] = credentials.organizationId as string;
					}

					const uploadResponse = await this.helpers.httpRequest(uploadOptions);
					fileId = uploadResponse.id;
				} else {
					// Use provided file ID
					fileId = this.getNodeParameter('fileId', i) as string;
				}

				// Step 2: Call Responses API
				const model = additionalOptions.model || 'gpt-5';
				const requestBody: IDataObject = {
					model,
				};
				
				// Determine input structure based on whether we have files
				if (operation === 'uploadAndProcess' || operation === 'processFileId' || (operation === 'aiToolMode' && fileId)) {
					// Use array structure for file inputs
					requestBody.input = [
						{
							role: 'user',
							content: [
								{
									type: 'input_text',
									text: prompt,
								},
								{
									type: 'input_file',
									file_id: fileId,
								},
							],
						},
					];
				} else {
					// Use simple string input for text-only requests
					requestBody.input = prompt;
				}

				// Add additional files if provided
				if (additionalOptions.additionalFiles) {
					const files = (additionalOptions.additionalFiles as IDataObject).files as IDataObject[];
					if (files && files.length > 0) {
						for (const file of files) {
							const inputArray = requestBody.input as IDataObject[];
							const content = inputArray[0].content as IDataObject[];
							if (file.fileSource === 'fileId') {
								content.push({
									type: 'input_file',
									file_id: file.fileId,
								});
							} else if (file.fileSource === 'url') {
								content.push({
									type: 'input_image',
									image: {
										url: file.url,
									},
								});
							}
						}
					}
				}

				// Add optional parameters
				if (additionalOptions.maxTokens) {
					requestBody.max_tokens = additionalOptions.maxTokens;
				}
				// Temperature is not supported by GPT-5 reasoning models
				// Only add it for non-GPT-5 models
				if (additionalOptions.temperature !== undefined && !String(model).startsWith('gpt-5')) {
					requestBody.temperature = additionalOptions.temperature;
				}
				// Add reasoning and GPT-5 specific features
				const modelString = String(model);
				
				// Build reasoning object if needed
				const reasoningConfig: IDataObject = {};
				
				if (additionalOptions.reasoningEffort) {
					reasoningConfig.effort = additionalOptions.reasoningEffort;
				}
				
				if (additionalOptions.reasoningSummary && additionalOptions.reasoningSummary !== 'none') {
					reasoningConfig.summary = additionalOptions.reasoningSummary;
				}
				
				// Apply reasoning configuration
				if (Object.keys(reasoningConfig).length > 0) {
					if (modelString.startsWith('gpt-5')) {
						// GPT-5 models use nested reasoning structure
						requestBody.reasoning = reasoningConfig;
					} else if (modelString.match(/^o[134]/)) {
						// O-series models - check if they support nested structure
						if (reasoningConfig.effort) {
							requestBody.reasoning_effort = reasoningConfig.effort;
						}
						if (reasoningConfig.summary) {
							// Try nested structure for summary
							requestBody.reasoning = { summary: reasoningConfig.summary };
						}
					}
				}
				
				// Add GPT-5 specific features
				if (modelString.startsWith('gpt-5')) {
					// Add verbosity control
					if (additionalOptions.verbosity) {
						if (!requestBody.text) {
							requestBody.text = {};
						}
						(requestBody.text as IDataObject).verbosity = additionalOptions.verbosity;
					}
				}

				const responseOptions: IHttpRequestOptions = {
					method: 'POST',
					url: `${baseUrl}/v1/responses`,
					headers: {
						'Authorization': `Bearer ${credentials.apiKey}`,
						'Content-Type': 'application/json',
					},
					body: requestBody,
					json: true,
				};

				if (credentials.organizationId) {
					responseOptions.headers!['OpenAI-Organization'] = credentials.organizationId as string;
				}

				const response = await this.helpers.httpRequest(responseOptions);

				// Format the response based on simplifyOutput setting
				let outputData: any;
				
				if (simplifyOutput) {
					// Extract just the essential content from the response structure
					// GPT-5 responses have structure: output[0].content[0].text
					let textContent = '';
					if (response.output && response.output[0]) {
						const output = response.output[0];
						if (output.content && output.content[0]) {
							textContent = output.content[0].text || '';
						}
					}
					// Fallback to other possible structures
					if (!textContent) {
						textContent = response.choices?.[0]?.message?.content || '';
					}
					
					outputData = {
						text: textContent,
						fileId: fileId,
						model: response.model || model,
						usage: response.usage,
					};
				} else {
					// Return full response with metadata
					outputData = {
						...response,
						fileId: fileId,
						prompt: prompt,
					};
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(outputData),
					{ itemData: { item: i } }
				);
				returnData.push(...executionData);

			} catch (error: any) {
				// Extract meaningful error message
				let errorMessage = 'Unknown error';
				let errorDetails: any = {};
				
				if (error.response) {
					// HTTP error response
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
							statusCode: error.response?.status,
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
						description: errorDetails.error?.message || undefined,
					}
				);
				throw nodeError;
			}
		}

		return [returnData];
	}
}