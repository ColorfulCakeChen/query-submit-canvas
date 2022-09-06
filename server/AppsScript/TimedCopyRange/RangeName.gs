const RANGE_NAME = {
  FETCHER_COPIER: {
    TIMER: {
      EVERY_MINUTES: "FetcherCopier.Timer.EveryMinutes",
      EVERY_HOURS: "FetcherCopier.Timer.EveryHours",
      LAST_TIME: "FetcherCopier.Timer.LastTime",
      COUNTER: "FetcherCopier.Timer.Counter",
      COUNTER_DIVISOR: "FetcherCopier.Timer.CounterDivisor",
      COUNTER_REMAINDER: "FetcherCopier.Timer.CounterRemainder",
    },
  },
  FETCHER: {
    TIMER: {
      AT_REMAINDER: "Fetcher.Timer.AtRemainder",
      LAST_TIME: "Fetcher.Timer.LastTime",
      COUNTER: "Fetcher.Timer.Counter",
    },
    GA4_PROPERTY_ID: "Fetcher.GA4.PropertyId",
    RESULT: {
      HEADERS: "Fetcher.Result.Headers",
      ROWS: "Fetcher.Result.Rows",
    },
  },
  COPIER: {
    TIMER: {
      AT_REMAINDER: "Copier.Timer.AtRemainder",
      LAST_TIME: "Copier.Timer.LastTime",
      COUNTER: "Copier.Timer.Counter",
    },
    SOURCE_NAME: "Copier.SourceName",
    TARGET_NAME: "Copier.TargetName",
  }
};
