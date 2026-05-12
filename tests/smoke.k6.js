import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL ?? 'https://devsaderiva.com.br'

export const options = {
  vus: 3,
  duration: '30s',
  thresholds: {
    http_req_failed:   ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
}

export default function () {
  const home = http.get(BASE_URL)
  check(home, {
    'home 200':      (r) => r.status === 200,
    'home has html': (r) => r.body.includes('<html'),
  })
  sleep(2)

  const manifesto = http.get(`${BASE_URL}/manifesto/`)
  check(manifesto, { 'manifesto 200': (r) => r.status === 200 })
  sleep(2)

  const devs = http.get(`${BASE_URL}/devs/`)
  check(devs, { 'devs 200': (r) => r.status === 200 })
  sleep(2)

  const categorias = http.get(`${BASE_URL}/categorias/tech/`)
  check(categorias, { 'categorias 200 or 404': (r) => r.status === 200 || r.status === 404 })
  sleep(1)
}
