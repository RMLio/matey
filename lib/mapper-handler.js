/**
 * Class for handling mapping engine interaction
 */
class MapperHandler {

  /**
   * Constructor
   * @param {String} url - URL of the mapping engine(s) endpoint
   * @param {Front} front 
   * @param {Logger} logger 
   */
  constructor(url, front, logger) {
    this.url = url; 
    this.front = front;
    this.logger = logger;
  }

  /**
   * Executes mapping by sending RML to mapping engine
   * @param {String} rmlDoc - RML document as string
   * @param {Array} sources - array of source objects { name: string, content: string }
   * @param {String} engine - identifies the engine to use (if not given, RMLMapper is used)
   * @returns {Promise<Object>} promise that resolves to mapping engine response
   */
  async executeMapping(rmlDoc, sources, engine = null) {
    try {
      const body = {
        rml: rmlDoc,
        functionStateId: this.functionStateId,
        sources
      };
      if (engine) {
        body.engine = engine;
      }

      let response;
      try {
        response = await fetch(this.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } catch (e) {
        this.logger.error('mapper_post_failed', { error: e });
        this.front.doAlert(`POST to mapping engine failed. Is it online at ${this.rmlMapperUrl}?`, 'danger', 5000);
        return;
      }
      if (!response.ok) {
        this.logger.error('mapper_response_not_ok', { status: response.status });
        this.front.doAlert('Mapping engine response not ok', 'danger', 5000);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        this.logger.error('mapper_response_not_json');
        this.front.doAlert('Mapping engine response could not be decoded', 'danger', 5000);
        return;
      }
      this.logger.info(`rmlMapper response: ${JSON.stringify(data, null, 2)}`);

      return data;

    } catch (err) {
      this.logger.error('ld_generation_error', err);
      throw err;
    }
  }
}

export default MapperHandler;
