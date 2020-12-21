function processFolder() {
  var folder = DriveApp.getFolderById("ADD_FOLDER_ID_HERE") //Add the folder containing the files you'd like to process
  var files = folder.getFilesByType(MimeType.PLAIN_TEXT)
  do {
    let file = files.next()
    let parsed = parseText(file.getBlob())
    createAndPopulateGoogleDoc(folder,file.getName(),parsed)
    file.setTrashed(true)
  } while (files.hasNext())
}

function parseText(txtFile) {
  const regex = RegExp(/(?<timestamp>\d{2}:\d{2}:\d{2})\s*From\s(?<name>.*)\s:\s(?<message>.*)/)
  var chatRow = txtFile.getDataAsString().split("\n").map(row=>{
    var parsed = row.match(regex)
    return parsed==null?row:parsed //if Regex doesn't pick up anything, send back the whole row
  })

  chatArr = []
  chatRow.forEach(row=>{
    if(row.length==4){
      chatArr.push({
        timestamp:row.groups.timestamp,
        name: row.groups.name,
        message:row.groups.message
      })
    }else{
      chatArr[chatArr.length-1].message += "\n"+row //If the row doesn't have a timestamp (aka regex didn't pick anything up,) just append the message on the row
    }
  })
  return chatArr
}

function createAndPopulateGoogleDoc(folder, filename, data){
  const regex = RegExp(/(?:http|ftp|https):\/\/(?:[\w_-]+(?:(?:\.[\w_-]+)+))(?:[\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?/)
  var styles = getStyles()
  filename = formatFilename(filename)
  var colors = getColorsByUser(data)
  var doc = DocumentApp.create(filename)
  var body = doc.getBody()
  body.insertParagraph(0,filename).setAttributes(styles.title)

  data.forEach((chatRow, index) => {
    var paragraph = body.insertParagraph(index+1,"")
    paragraph.appendText(chatRow.timestamp + " ").setAttributes(styles.timestamp)
    paragraph.appendText(chatRow.name + ": ").setAttributes(styles.name)
    var message = paragraph.appendText(chatRow.message).setAttributes(styles.message)
    
    //Make URLs clickable
    var match = chatRow.message.match(regex)
    if(match){
      var url = match[0]
      var idx = match.index
      message.setLinkUrl(idx, idx + url.length-1, url)
    }
    paragraph.appendHorizontalRule()
  })

  let file = DriveApp.getFileById(doc.getId())
  file.moveTo(folder)
}

function getColorsByUser(data){ //TODO: ensure all hex codes are valid and give each person their own color for the chat
  var listOfNames = []
  data.forEach(e=>{
    if(listOfNames.includes(e.name)){
      return
    }else{
      listOfNames.push(e.name)
    }
  })
  var colorSet = {}
  listOfNames.forEach(e=>{
      colorSet[e] = "#"+Math.floor(Math.random()*12230000).toString(16) //modified randomizer to prevent unreadable colors
  })
  return colorSet
}

function getStyles(){
  var timestamp = {}
  timestamp[DocumentApp.Attribute.BOLD] = false;
  timestamp[DocumentApp.Attribute.FONT_SIZE] = 10
  
  var name = {}
  name[DocumentApp.Attribute.BOLD] = true;
  name[DocumentApp.Attribute.FONT_SIZE] = 12

  var message = {}
  message[DocumentApp.Attribute.BOLD] = false;
  message[DocumentApp.Attribute.FONT_SIZE] = 12

  var title = {}
  title[DocumentApp.Attribute.FONT_SIZE] = 24
  title[DocumentApp.Attribute.BOLD] = false;

  return {name:name, message:message, title:title, timestamp:timestamp}
}

function formatFilename(name){
  const regex = RegExp(/(?<year>\d{4})\s(?<month>\d{1,2})\s(?<day>\d{1,2})/)
  var updated = name.match(regex).groups
  updated = [updated.month, updated.day, updated.year]
  return "Meeting Chat "+updated.join("/")
}
