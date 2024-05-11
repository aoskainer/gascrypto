class CustomLogger {
  _folder: GoogleAppsScript.Drive.Folder
  _logFileName: string
  _logs: string[]

  constructor(appName: string) {
    const logFolderId = PropertiesService.getScriptProperties().getProperty("LOG_FOLDER_ID")!
    this._folder = DriveApp.getFolderById(logFolderId)
    this._logFileName = `${appName}.${new Date().toISOString()}.log`
    this._logs = []
  }

  debug(message: string) {
    this._logs.push(`${new Date().toISOString()} [DEBUG] ${message}`)
  }

  info(message: string) {
    this._logs.push(`${new Date().toISOString()} [INFO] ${message}`)
  }

  warn(message: string) {
    this._logs.push(`${new Date().toISOString()} [WARN] ${message}`)
  }

  error(message: string) {
    this._logs.push(`${new Date().toISOString()} [ERROR] ${message}`)
  }

  finalize() {
    this._folder.createFile(this._logFileName, this._logs.join("\n"))
  }
}

export default CustomLogger
