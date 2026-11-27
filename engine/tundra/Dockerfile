FROM debian:bookworm-slim
RUN dpkg --add-architecture i386 && apt-get update && apt-get install -y --no-install-recommends wine wine32:i386 xvfb xauth ca-certificates && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 10001 tundra
USER tundra
ENV WINEARCH=win32 WINEPREFIX=/home/tundra/.wine WINEDEBUG=-all
WORKDIR /home/tundra
# Mount the licensed original files read-only at /opt/tundra.
# Copy them into the writable working directory before launching.
CMD ["sh","-c","test -f /opt/tundra/Tundra.exe && mkdir -p /home/tundra/engine && cp -R /opt/tundra/. /home/tundra/engine/ && cd /home/tundra/engine && exec xvfb-run -a wine Tundra.exe"]
