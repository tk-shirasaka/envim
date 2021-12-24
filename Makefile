NORMAL_FONT_DOWNLOAD_URL	=
NORMAL_FONT_DOWNLOAD_FILE	=
NORMAL_REGULAR_FONT_FILE_NAME	=
NORMAL_BOLD_FONT_FILE_NAME	=
EDITOR_FONT_DOWNLOAD_URL	=
EDITOR_FONT_DOWNLOAD_FILE	=
EDITOR_REGULAR_FONT_FILE_NAME	=
EDITOR_BOLD_FONT_FILE_NAME	=

DOWNLOAD_CMD			= curl -O -L
UNZIP_CMD			= unzip -o
RELEASE_CMD			= npm run release --
TARGET_FILE_NAME		=

build: install fonts/NORMAL/$(NORMAL_FONT_DOWNLOAD_FILE).zip fonts/EDITOR/$(EDITOR_FONT_DOWNLOAD_FILE).zip
	npm run build

install:
	npm install

fonts/%.zip:
	$(DOWNLOAD_CMD) $($(*D)_FONT_DOWNLOAD_URL)
	$(UNZIP_CMD) -d $(*F) $(*F)
	mv $(*F)/$($(*D)_REGULAR_FONT_FILE_NAME) fonts/$(*D)-Regular
	mv $(*F)/$($(*D)_BOLD_FONT_FILE_NAME) fonts/$(*D)-Bold
	rm -rf $(@D)
	mkdir -p $(@D)
	touch $@
	rm -rf $(*F) $(@F)

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
