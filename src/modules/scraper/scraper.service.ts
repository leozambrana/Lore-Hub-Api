import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface WikiMetadata {
  title: string | null;
  image: string | null;
  description: string | null;
  url: string;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  async scrapeUrl(url: string): Promise<WikiMetadata> {
    const result: WikiMetadata = {
      title: null,
      image: null,
      description: null,
      url,
    };

    try {
      if (url.includes('reddit.com')) {
        try {
          const redditJsonUrl = url.includes('?')
            ? url.replace('?', '.json?')
            : url.endsWith('/')
              ? `${url.slice(0, -1)}.json`
              : `${url}.json`;
          console.log('redditJsonUrl: ', redditJsonUrl);
          const { data: redditData } = await axios.get(redditJsonUrl, {
            headers: {
              'User-Agent': 'web:LoreHub:v1.0.0 (by /u/LoreHubProject)',
              Accept: 'application/json',
            },
            timeout: 5000,
          });
          console.log('redditData: ', redditData);

          const postData = redditData[0]?.data?.children[0]?.data;
          if (postData) {
            result.title = postData.title || null;
            result.description = postData.selftext || null;

            // Busca imagem: imagem direta ou preview
            let img = postData.url || null;
            const isImage = img?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

            if (!isImage && postData.preview?.images?.[0]?.source?.url) {
              img = postData.preview.images[0].source.url;
            }

            // Limpa escape do Reddit (&amp; -> &)
            result.image = img ? img.replace(/&amp;/g, '&') : null;

            if (result.description && result.description.length > 300) {
              result.description = result.description.substring(0, 300) + '...';
            }

            this.logger.debug(
              `Scraping via API Reddit realizado com sucesso: ${url}`,
            );
            return result;
          }
        } catch (redditErr) {
          this.logger.warn(
            `Falha na API do Reddit para "${url}", tentando fallback...`,
          );
          console.log('redditErr: ', redditErr);
        }
      }

      if (url.includes('fandom.com')) {
        try {
          const parsedUrl = new URL(url);
          const subdomain = parsedUrl.hostname.split('.')[0];
          const slug = parsedUrl.pathname.split('/wiki/')[1];

          if (slug) {
            const apiUrl = `https://${subdomain}.fandom.com/api.php?action=query&format=json&prop=pageimages|extracts&titles=${slug}&pithumbsize=1000&exintro=true&explaintext=true&redirects=1`;

            const { data: apiResponse } = await axios.get(apiUrl, {
              timeout: 5000,
            });
            const pages = apiResponse.query?.pages;
            const pageId = Object.keys(pages || {})[0];

            if (pageId && pageId !== '-1') {
              const pageData = pages[pageId];
              result.title = pageData.title || null;
              result.image = pageData.thumbnail?.source || null;
              result.description = pageData.extract || null;

              if (result.description && result.description.length > 300) {
                result.description =
                  result.description.substring(0, 300) + '...';
              }

              this.logger.debug(
                `Scraping via API Fandom realizado com sucesso: ${url}`,
              );
              return result;
            }
          }
        } catch (apiErr) {
          this.logger.warn(
            `Falha na API da Fandom para "${url}", tentando fallback...`,
          );
          console.error('apiErr: ', apiErr);
        }
      }

      // --- Estratégia Tradicional: Cheerio (Fallback para outros sites) ---
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Referer: 'https://www.google.com/',
      };

      const { data: html } = await axios.get(url, {
        timeout: 10000,
        headers,
      });

      const $ = cheerio.load(html);

      // --- Busca de Título ---
      const rawTitle =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('h1#firstHeading').text().trim() ||
        $('h1').first().text().trim() ||
        $('title').text().trim() ||
        null;

      if (
        rawTitle &&
        !rawTitle.toLowerCase().includes('wait for verification')
      ) {
        result.title = rawTitle;
      }

      // --- Busca de Imagem ---
      let rawImage =
        $('meta[property="og:image"]').attr('content') ||
        $('link[rel="image_src"]').attr('href') ||
        $('meta[name="twitter:image"]').attr('content') ||
        $('.pi-image-thumbnail').first().attr('src') ||
        $('article img').first().attr('src') ||
        null;

      if (rawImage && rawImage.includes('/revision/latest')) {
        rawImage = rawImage.split('/revision/latest')[0] + '/revision/latest';
      }

      if (rawImage && rawImage.startsWith('/')) {
        try {
          const parsedUrl = new URL(url);
          rawImage = `${parsedUrl.origin}${rawImage}`;
        } catch (e) {
          this.logger.warn(`Falha ao fazer scraping de "${url}": ${e.message}`);
        }
      }
      result.image = rawImage;

      // --- Busca de Descrição ---
      result.description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        $('article p').first().text().trim() ||
        null;

      if (result.description && result.description.length > 300) {
        result.description = result.description.substring(0, 300) + '...';
      }
    } catch (err) {
      this.logger.warn(`Falha ao fazer scraping de "${url}": ${err.message}`);
    }

    return result;
  }
}
