import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CountryConfig } from '../contracts';
import { COUNTRY_CONFIG } from '../behavior/behavior.tokens';
import mexicoConfig from './configs/mexico.behaviors.json';
import peruConfig from './configs/peru.behaviors.json';

type SupportedCountry = 'MX' | 'PE';

const SUPPORTED: SupportedCountry[] = ['MX', 'PE'];

@Module({})
export class CountryModule {
  static async forRoot(): Promise<DynamicModule> {
    const country = process.env.COUNTRY as SupportedCountry | undefined;
    if (!country) {
      throw new Error(
        'Variable de entorno COUNTRY no definida. Valores soportados: ' +
          SUPPORTED.join(', '),
      );
    }
    if (!SUPPORTED.includes(country)) {
      throw new Error(
        `País '${country}' no soportado. Valores soportados: ${SUPPORTED.join(', ')}`,
      );
    }

    let countryModule: unknown;
    let config: CountryConfig;

    switch (country) {
      case 'MX': {
        const mx = await import('@identity/lib-mexico');
        countryModule = mx.MexicoModule;
        config = mexicoConfig as CountryConfig;
        break;
      }
      case 'PE': {
        const pe = await import('@identity/lib-peru');
        countryModule = pe.PeruModule;
        config = peruConfig as CountryConfig;
        break;
      }
    }

    const configProvider: Provider = {
      provide: COUNTRY_CONFIG,
      useValue: config,
    };

    return {
      module: CountryModule,
      imports: [countryModule as DynamicModule],
      providers: [configProvider],
      exports: [configProvider, countryModule as DynamicModule],
      global: true,
    };
  }
}
