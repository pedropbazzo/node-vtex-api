import axios from 'axios'

export default class Client {
  constructor (authToken: string, userAgent: string, baseURL: string) {
    const headers = {
      'Authorization': `token ${authToken}`,
      'User-Agent': userAgent,
    }
    this.http = axios.create({
      baseURL,
      headers,
    })
  }
}
