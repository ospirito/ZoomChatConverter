# ZoomChatConverter
A simple GScript to intake .txt files exported from Zoom and convert them to formatted Google Docs.

# Usage
Simply add this code to a new script at Script.Google.com, enter the folder ID where your Zoom .txt files are stored, and run!

If you're using a shared folder, you can set up a [Trigger](https://developers.google.com/apps-script/guides/triggers) to run the script on a cadence, so that all .txt files will be converted after they're dropped in the folder.

# Things to Know
If you've changed the filename of the .txt files, you may have to edit the title formatter. Right now, it expects the inputted title to be the date format that Zoom puts out automatically.

