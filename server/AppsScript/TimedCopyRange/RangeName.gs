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
    GA4: {
      PROPERTY_ID: "Fetcher.GA4.PropertyId",
      ITEM_NAME_IN_LIST_FILTER: {
        RANGE_NAME: "Fetcher.GA4.ItemNameInListFilter.RangeName",
      },
      REPORT: {
        HEADER: {
          RANGE_NAME: "Fetcher.GA4.Report.Headers.RangeName",
        },
        ROWS: {
          RANGE_NAME: "Fetcher.GA4.Report.Rows.RangeName",
        },
      },
    },
  },
  COPIER: {
    TIMER: {
      AT_REMAINDER: "Copier.Timer.AtRemainder",
      LAST_TIME: "Copier.Timer.LastTime",
      COUNTER: "Copier.Timer.Counter",
    },
    SOURCE: {
      RANGE_NAMES: "Copier.Source.RangeNames",
    },
    TARGET: {
      RANGE_NAMES: "Copier.Target.RangeNames",
    },
  }
};
