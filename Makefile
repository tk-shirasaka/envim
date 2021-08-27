FONT_VERSION		=
FONT_NAME		= HackGenNerd
FONT_FILE_NAME		= $(FONT_NAME)_$(FONT_VERSION)
FONT_DOWNLOAD_URL	= https://github.com/yuru7/HackGen/releases/download/$(FONT_VERSION)/$(FONT_FILE_NAME).zip

DOWNLOAD_CMD		= curl -O -L
UNZIP_CMD		= unzip -o
RELEASE_CMD		= npm run release --
TARGET_FILE_NAME	=

build: install $(FONT_FILE_NAME).zip
	npm run build

install:
	npm install

$(FONT_FILE_NAME).zip:
	$(DOWNLOAD_CMD) $(FONT_DOWNLOAD_URL)
	$(UNZIP_CMD) $(FONT_FILE_NAME)
	mv -f $(FONT_FILE_NAME) fonts

linux: build
	$(RELEASE_CMD) --linux appImage
ifdef TARGET_FILE_NAME
	rm -rf $(TARGET_FILE_NAME)
	mv dist/Envim-1.0.0.AppImage $(TARGET_FILE_NAME)
endif

mac: build
	$(RELEASE_CMD) --mac zip
ifdef TARGET_FILE_NAME
	rm -rf $(TARGET_FILE_NAME)
	mv dist/mac/Envim.app $(TARGET_FILE_NAME)
endif

windows: build
	$(RELEASE_CMD) --win zip
ifdef TARGET_FILE_NAME
	rm -rf $(TARGET_FILE_NAME)
	mv dist/win-unpacked $(TARGET_FILE_NAME)
endif
