export class ControllerGatewayFailure extends Error {
  constructor(readonly status: number) {
    super('The connected gateway did not complete the request.')
  }
}
