function processFolder() {
  var folder = DriveApp.getFolderById("1c76ez6iFNKXFNVyl1XM7iRYAwt8RBTEZ")
  var files = folder.getFilesByType(MimeType.PLAIN_TEXT)
  if(!files.hasNext()){return} //If there are no txt files, end executions
  do {
    let file = files.next()
    if(file.getName().includes("Converted")){
      return
    }
    let parsed = parseText(file.getBlob())
    createAndPopulateGoogleDoc(folder,file.getName(),parsed)
    try{
      Drive.Files.remove(file.getId());
    }catch(error){
      file.setName(file.getName()+"(Converted)")
    }
    //file.setTrashed(true)
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
      chatArr[chatArr.length-1].message += "\n"+row
    }
  })
  return chatArr
}

function createAndPopulateGoogleDoc(folder, filename, data){
  const regex = RegExp(/(?:http|ftp|https):\/\/(?:[\w_-]+(?:(?:\.[\w_-]+)+))(?:[\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?/)
  var styles = getStyles()
  filename = formatFilename()
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

function getColorsByUser(data){ //TODO: ensure all hex codes are valid
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

function formatFilename(){
  var date = Utilities.formatDate(new Date(),Session.getTimeZone(),"M/d/yyyy")
  return "Meeting Chat "+date
}
