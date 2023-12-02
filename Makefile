NORMAL_FONT_DOWNLOAD_URL	=
NORMAL_FONT_DOWNLOAD_FILE	=
NORMAL_REGULAR_FONT_FILE_NAME	=
NORMAL_BOLD_FONT_FILE_NAME	=
ICON_FONT_DOWNLOAD_URL		= https://github.com/ryanoasis/nerd-fonts/releases/download/v3.1.1/NerdFontsSymbolsOnly.zip
ICON_FONT_DOWNLOAD_FILE		= NerdFontsSymbolsOnly_v3.1.1
ICON_REGULAR_FONT_FILE_NAME	= SymbolsNerdFontMono-Regular.ttf
ICON_BOLD_FONT_FILE_NAME	= SymbolsNerdFontMono-Regular.ttf

DOWNLOAD_CMD			= curl -L
UNZIP_CMD			= unzip -o
RELEASE_CMD			= npm run release --
TARGET_FILE_NAME		=

build: install fonts/NORMAL/$(NORMAL_FONT_DOWNLOAD_FILE).zip fonts/ICON/$(ICON_FONT_DOWNLOAD_FILE).zip
	npm run build

install:
	npm install

fonts/%.zip:
	$(DOWNLOAD_CMD) $($(*D)_FONT_DOWNLOAD_URL) -o $($(*D)_FONT_DOWNLOAD_FILE).zip
	$(UNZIP_CMD) -d $(*F) $(*F)
	cp $(*F)/$($(*D)_REGULAR_FONT_FILE_NAME) fonts/$(*D)-Regular
	cp $(*F)/$($(*D)_BOLD_FONT_FILE_NAME) fonts/$(*D)-Bold
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
