FROM mhart/alpine-node:6.7
MAINTAINER Jeff Dickey <dickeyxxx@gmail.com>

# Install NodeJS and node-gyp deps
RUN http_proxy=http://10.8.8.8:3142 apk --no-cache add \
        g++ \
        gcc \
        make \
        python 

# Create user and group
RUN addgroup -S register \
    && adduser -D -S \
        -s /bin/bash \
        -h /srv/npm-register \
        -G register \
        register

# Deploy application
COPY . /srv/npm-register
WORKDIR /srv/npm-register
RUN npm install --production \
    && chown -R register:register .

# Share storage volume
ENV NPM_REGISTER_FS_DIRECTORY /data
RUN mkdir /data && chown register:register /data
VOLUME /data

# Start application
EXPOSE 3000
USER register
ENV NODE_ENV production
CMD ["node", "start.js"]

