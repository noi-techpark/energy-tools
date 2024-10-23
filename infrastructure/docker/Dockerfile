# SPDX-FileCopyrightText: 2024 NOI Techpark <digital@noi.bz.it>
#
# SPDX-License-Identifier: CC0-1.0

FROM node:14

WORKDIR /usr/src/app

COPY src/* .

RUN npm install -g http-server

EXPOSE 8080

CMD ["http-server", "-p", "8080"]