const RANGE_NAME = {
  FC: {
    TIMER: {
      EVERY_MINUTES: "FC.Timer.EveryMinutes",
      EVERY_HOURS: "FC.Timer.EveryHours",
      LAST_TIME: "FC.Timer.LastTime",
      COUNTER: "FC.Timer.Counter",
      COUNTER_DIVISOR: "FC.Timer.CounterDivisor",
      COUNTER_REMAINDER: "FC.Timer.CounterRemainder",
    },
    FETCHER: {
      TIMER: {
        AT_REMAINDER: "FC.Fetcher.Timer.AtRemainder",
        LAST_TIME: "FC.Fetcher.Timer.LastTime",
        COUNTER: "FC.Fetcher.Timer.Counter",
      },
      GA4: {
        PROPERTY_ID: "FC.Fetcher.GA4.PropertyId",
        ITEM_NAME_IN_LIST_FILTER: {
          RANGE_NAME: "FC.Fetcher.GA4.ItemNameInListFilter.RangeName",
        },
        REPORT: {
          HEADERS: {
            RANGE_NAME: "FC.Fetcher.GA4.Report.Headers.RangeName",
          },
          ROWS: {
            RANGE_NAME: "FC.Fetcher.GA4.Report.Rows.RangeName",
          },
        },
      },
    },
    COPIER: {
      TIMER: {
        AT_REMAINDER: "FC.Copier.Timer.AtRemainder",
        LAST_TIME: "FC.Copier.Timer.LastTime",
        COUNTER: "FC.Copier.Timer.Counter",
      },
      SOURCE: {
        RANGE_NAMES: "FC.Copier.Source.RangeNames",
      },
      TARGET: {
        RANGE_NAMES: "FC.Copier.Target.RangeNames",
      },
    }
  },
};
