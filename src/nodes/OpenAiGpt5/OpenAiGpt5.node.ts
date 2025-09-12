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
						displayName: 'Quick Response Mode',
						name: 'quickMode',
						type: 'boolean',
						default: false,
						description: 'Whether to optimize for speed over quality (uses low reasoning effort and medium search context)',
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
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						default: 0.7,
						typeOptions: {
							minValue: 0,
							maxValue: 2,
							numberStepSize: 0.1,
						},
						description: 'Controls randomness (0=deterministic, 2=creative)',
					},
					{
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						default: 600,
						typeOptions: {
							minValue: 60,
							maxValue: 1800,
						},
						description: 'Request timeout in seconds (60-1800). Note: n8n global timeout may also apply - set EXECUTIONS_TIMEOUT environment variable for longer executions.',
					},
				],
			},
			{
				displayName: 'Web Search',
				name: 'webSearch',
				type: 'collection',
				placeholder: 'Add Web Search Options',
				default: {},
				options: [
					{
						displayName: 'Allowed Domains',
						name: 'allowedDomains',
						type: 'string',
						default: '',
						placeholder: 'example.com, docs.site.com',
						description: 'Comma-separated list of domains to restrict search to (max 20)',
						displayOptions: {
							show: {
								enabled: [true],
							},
						},
					},
					{
						displayName: 'Enable Web Search',
						name: 'enabled',
						type: 'boolean',
						default: false,
						description: 'Whether to allow the model to search the web for current information',
					},
					{
						displayName: 'Include Sources',
						name: 'includeSources',
						type: 'boolean',
						default: true,
						description: 'Whether to include the list of all sources searched in the response',
						displayOptions: {
							show: {
								enabled: [true],
							},
						},
					},
					{
						displayName: 'Search Context Size',
						name: 'searchContextSize',
						type: 'options',
						options: [
							{
								name: 'Low',
								value: 'low',
								description: 'Least context, fastest response',
							},
							{
								name: 'Medium',
								value: 'medium',
								description: 'Balanced context and latency (default)',
							},
							{
								name: 'High',
								value: 'high',
								description: 'Most comprehensive context, slower response',
							},
						],
						default: 'medium',
						description: 'Amount of context retrieved from web searches',
						displayOptions: {
							show: {
								enabled: [true],
							},
						},
					},
					{
						displayName: 'User Location',
						name: 'userLocation',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: false,
						},
						description: 'Approximate location for localized search results',
						displayOptions: {
							show: {
								enabled: [true],
							},
						},
						options: [
							{
								name: 'location',
								displayName: 'Location',
								values: [
									{
										displayName: 'Country',
										name: 'country',
										type: 'string',
										default: '',
										placeholder: 'US',
										description: 'Two-letter ISO country code (e.g., US, GB, AU)',
									},
									{
										displayName: 'City',
										name: 'city',
										type: 'string',
										default: '',
										placeholder: 'San Francisco',
										description: 'City name for localized results',
									},
									{
										displayName: 'Region',
										name: 'region',
										type: 'string',
										default: '',
										placeholder: 'California',
										description: 'State or region name',
									},
									{
										displayName: 'Timezone',
										name: 'timezone',
										type: 'string',
										default: '',
										placeholder: 'America/Los_Angeles',
										description: 'IANA timezone (e.g., America/New_York)',
									},
								],
							},
						],
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
			
			// Already an array (this happens when expressions return arrays)
			if (Array.isArray(input)) {
				// Flatten nested arrays and extract strings
				const flattened = input.flat();
				return flattened.map(item => {
					// Handle objects that might have url or other properties
					if (typeof item === 'object' && item !== null) {
						// Check for common properties
						if (item.url) return String(item.url).trim();
						if (item.path) return String(item.path).trim();
						if (item.value) return String(item.value).trim();
						// Fallback to JSON string
						return JSON.stringify(item);
					}
					return String(item).trim();
				}).filter(item => item && item !== '[object Object]');
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
						// Not valid JSON, might be malformed array string
						// Try to extract URLs or file IDs from it
						const matches = trimmed.match(/(https?:\/\/[^\s,\]]+|file_[a-zA-Z0-9]+)/g);
						if (matches) {
							return matches;
						}
					}
				}
				
				// Check if it's comma-separated
				if (trimmed.includes(',')) {
					return trimmed.split(',').map(s => s.trim()).filter(s => s);
				}
				// Single item
				return [trimmed];
			}
			
			// Object input (might be from n8n)
			if (typeof input === 'object' && input !== null) {
				// Check if it has a property that contains the actual data
				if (input.data && Array.isArray(input.data)) {
					return parseFileInput(input.data);
				}
				if (input.body && Array.isArray(input.body)) {
					return parseFileInput(input.body);
				}
				// Try to extract meaningful value
				if (input.url) return [String(input.url).trim()];
				if (input.path) return [String(input.path).trim()];
				if (input.value) return [String(input.value).trim()];
			}
			
			// Other types - try to convert to string
			const str = String(input).trim();
			// Avoid returning meaningless strings
			if (str && str !== '[object Object]' && str !== 'undefined' && str !== 'null') {
				return [str];
			}
			return [];
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const prompt = this.getNodeParameter('prompt', i) as string;
				const pdfFiles = this.getNodeParameter('pdfFiles', i, '') as any;
				const imageFiles = this.getNodeParameter('imageFiles', i, '') as any;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;
				const webSearch = this.getNodeParameter('webSearch', i, {}) as IDataObject;

				let model = options.model || 'gpt-5';
				const timeout = (options.timeout as number) || 600;
				const quickMode = options.quickMode as boolean;

				// Apply quick mode optimizations
				let reasoningEffort = options.reasoningEffort;
				let searchContextSize = webSearch.searchContextSize;
				
				if (quickMode) {
					// Override settings for speed
					reasoningEffort = 'low';
					searchContextSize = 'medium';
					// Use faster models when in quick mode
					if (model === 'gpt-5') {
						model = 'gpt-5-mini';
					} else if (model === 'gpt-4.1') {
						model = 'gpt-4.1-mini';
					} else if (model === 'o3') {
						model = 'o3-mini';
					}
				}

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
				
				if (options.temperature !== undefined) {
					requestBody.temperature = options.temperature;
				}

				// Add reasoning configuration for supported models (GPT-5 and GPT-4.1 support reasoning)
				const modelStr = String(model);
				if ((reasoningEffort || options.reasoningSummary) && 
				    (modelStr.startsWith('gpt-5') || modelStr.startsWith('gpt-4.1'))) {
					const reasoning: IDataObject = {};
					
					if (reasoningEffort) {
						reasoning.effort = reasoningEffort;
					}
					
					if (options.reasoningSummary && options.reasoningSummary !== 'none') {
						reasoning.summary = options.reasoningSummary;
					}
					
					requestBody.reasoning = reasoning;
				}
				
				// Add web search tool if enabled
				if (webSearch.enabled === true) {
					const tools: IDataObject[] = [];
					const webSearchTool: IDataObject = {
						type: 'web_search',
					};
					
					// Add search context size if specified (use override from quick mode if applicable)
					const contextSize = searchContextSize || webSearch.searchContextSize;
					if (contextSize) {
						webSearchTool.search_context_size = contextSize;
					}
					
					// Add allowed domains filter if specified
					if (webSearch.allowedDomains && typeof webSearch.allowedDomains === 'string') {
						const domains = webSearch.allowedDomains
							.split(',')
							.map((d: string) => d.trim())
							.filter((d: string) => d.length > 0);
						
						if (domains.length > 0) {
							webSearchTool.filters = {
								allowed_domains: domains.slice(0, 20), // Max 20 domains
							};
						}
					}
					
					// Add user location if specified
					const location = (webSearch.userLocation as any)?.location;
					if (location && (location.country || location.city || location.region || location.timezone)) {
						const userLocation: IDataObject = {
							type: 'approximate',
						};
						
						if (location.country) userLocation.country = location.country;
						if (location.city) userLocation.city = location.city;
						if (location.region) userLocation.region = location.region;
						if (location.timezone) userLocation.timezone = location.timezone;
						
						webSearchTool.user_location = userLocation;
					}
					
					tools.push(webSearchTool);
					requestBody.tools = tools;
					
					// Add include parameter for sources if requested
					if (webSearch.includeSources === true) {
						requestBody.include = ['web_search_call.action.sources'];
					}
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
					timeout: timeout * 1000, // Convert seconds to milliseconds
				};

				if (credentials.organizationId) {
					responseOptions.headers['OpenAI-Organization'] = credentials.organizationId as string;
				}

				const response = await this.helpers.httpRequest(responseOptions);

				// Extract text from response - based on actual API docs
				let textContent = '';
				let reasoningSummary = null;
				let webSearchResults = null;
				let citations: any[] = [];
				let sources: string[] = [];
				
				// Primary structure from Responses API docs
				if (response.output_text) {
					textContent = response.output_text;
				}
				// Alternative structure with output array (web search responses use this)
				else if (response.output && Array.isArray(response.output)) {
					for (const output of response.output) {
						// Handle web search call output
						if (output.type === 'web_search_call') {
							webSearchResults = {
								id: output.id,
								status: output.status,
								query: output.action?.query || null,
								domains: output.action?.domains || [],
								sources: output.action?.sources || [],
							};
							// Collect sources if present
							if (output.action?.sources && Array.isArray(output.action.sources)) {
								sources = output.action.sources;
							}
						}
						// Handle message output
						else if (output.type === 'message' && output.content && Array.isArray(output.content)) {
							for (const content of output.content) {
								if (content.type === 'output_text' && content.text) {
									textContent = content.text;
									// Extract citations from annotations
									if (content.annotations && Array.isArray(content.annotations)) {
										citations = content.annotations.filter((a: any) => a.type === 'url_citation').map((c: any) => ({
											url: c.url,
											title: c.title,
											startIndex: c.start_index,
											endIndex: c.end_index,
										}));
									}
									break;
								}
							}
						}
						// Alternative content structure
						else if (output.content && Array.isArray(output.content)) {
							for (const content of output.content) {
								if (content.type === 'output_text' && content.text) {
									textContent = content.text;
									break;
								}
							}
						}
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
					timeout: timeout,
					quickMode: quickMode,
				};
				
				// Add web search data if present
				if (webSearchResults) {
					outputData.webSearch = webSearchResults;
				}
				
				// Add citations if present
				if (citations.length > 0) {
					outputData.citations = citations;
				}
				
				// Add sources if requested and present
				if (webSearch.includeSources === true && sources.length > 0) {
					outputData.sources = sources;
				}
				
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
				
				// Handle timeout errors specifically
				if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
					const currentOptions = this.getNodeParameter('options', i, {}) as IDataObject;
					const currentTimeout = (currentOptions.timeout as number) || 600;
					const currentQuickMode = currentOptions.quickMode as boolean;
					errorMessage = `Request timed out after ${currentTimeout} seconds. For longer operations, increase the timeout setting or use Quick Response Mode. If using complex reasoning or web search, consider setting n8n's EXECUTIONS_TIMEOUT environment variable to a higher value.`;
					errorDetails = {
						timeout: currentTimeout,
						quickModeAvailable: !currentQuickMode,
						suggestions: [
							'Enable Quick Response Mode for faster processing',
							'Increase the Timeout setting in Options',
							'Use lower Reasoning Effort (Low instead of High)', 
							'Set n8n environment variable EXECUTIONS_TIMEOUT for longer executions',
							'Split large documents into smaller chunks'
						]
					};
				}
				// Handle other HTTP errors
				else if (error.response) {
					errorMessage = error.response.statusText || `HTTP ${error.response.status}`;
					if (error.response.body) {
						errorDetails = error.response.body;
						if (error.response.body.error) {
							errorMessage = error.response.body.error.message || errorMessage;
						}
					}
				} 
				// Handle other errors
				else if (error.message) {
					errorMessage = error.message;
					// Check if it's a different kind of timeout
					if (error.message.includes('exceeded')) {
						errorMessage += ` Consider increasing timeout settings or using Quick Response Mode.`;
					}
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