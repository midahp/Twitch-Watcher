> This is a fork of the abandoned repository at github.com/suidin/tw-vods
> The player remained the same for the most part, but the directory was changed a lot and now also uses preact

This is a simple Chrome/Firefox Extension that is an alternative UI and player for content from twitch.tv.
This is supposed to only implement the minimum required to watch livestreams/videos, without all the other things twitch.tv has to offer.

# General
All media data is loaded from twitch.tv. Api calls are used to collect various datasets from twitch.tv.

This extension uses the hls streaming library hls.js from https://github.com/video-dev/hls.js.

After installing the extension, the directory page will open. 
Clicking the extension icon or typing "twitch.simple" in the address bar will also open it.

# Player Keybindings

* ```f``` enter/leave fullscreen
* ```space``` play/pause
* ```m``` mute/unmute
* ```c``` hide/show chat
* ```s``` hide/show settings
* ```→``` go 5secs forward
* ```←``` go 5secs back
* ```+``` go 30secs forward
* ```-``` go 30secs backwards
* ```↑``` increase volume
* ```↓``` decrease volume

While holding ```Alt``` and pressing ```+/-``` you can go forward/backwards multiples of 30secs.

# Chat

You can move and resize the chat window.
Use "Advance chat by" in the chat options (top right in the player) to sync the chat with the video.

If you increase the time the chat will catch up to the video.
Values < 0 are almost never needed unless you want to see chat with a delay.

You can filter chat messages by usernames, phrases or regular expressions.

# Building

There is no build process for this project. This was an intentional decision to make it easier for other people to fork and change it.
You can load the "extension" folder directly in chrome ('load unpacked') which is best for development.
Under windows this will always show a warning message when chrome is started.
Consult google for packing an extension (it's easy).

I might put the packed extension files in the 'releasese' section.
