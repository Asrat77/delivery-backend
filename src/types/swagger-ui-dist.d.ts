declare module "swagger-ui-dist" {
  import { RequestHandler } from "express";
  interface SwaggerUIOptions {
    customCss?: string;
    customCssUrl?: string;
    swaggerUrl?: string;
    url?: string;
    urls?: Array<{ url: string; name: string }>;
    explorer?: boolean;
    customSiteTitle?: string;
  }
  const serve: RequestHandler[];
  function setup(swaggerDocument: unknown, options?: SwaggerUIOptions): RequestHandler;
  export { serve, setup };
}
