export const IPC_CHANNELS = {
  // Files domain
  FILES_GET: 'files:get',
  FILES_GET_PREVIEW: 'files:getPreview',
  FILES_SELECT: 'files:select',
  FILES_IMPORT: 'files:import',
  FILES_UPLOAD: 'files:upload',
  FILES_REMOVE: 'files:remove',
  FILES_CLEAR: 'files:clear',

  // Conversion domain
  CONVERSION_CONVERT: 'conversion:convert',
  CONVERSION_CONVERT_ALL: 'conversion:convertAll',
  CONVERSION_PROGRESS: 'conversion:progress',

  // System domain
  SYSTEM_OPEN_FOLDER: 'system:openFolder',
  SYSTEM_GET_OUTPUT_DIR: 'system:getOutputDir',
  SYSTEM_SELECT_OUTPUT_DIR: 'system:selectOutputDir'
} as const;

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
