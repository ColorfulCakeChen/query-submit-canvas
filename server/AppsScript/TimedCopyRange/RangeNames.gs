const RANGE_NAME = {
  FC: {
    TIMER: {
      EVERY_MINUTES: "FC.Timer.EveryMinutes",
      EVERY_HOURS: "FC.Timer.EveryHours",

//!!! (2023/07/26 Remarked) Use fetcherTimer_onTime_() and copierTimer_onTime_() directly.
//       LAST_TIME: "FC.Timer.LastTime",
//       COUNTER: "FC.Timer.Counter",
//       COUNTER_DIVISOR: "FC.Timer.CounterDivisor",
//       COUNTER_REMAINDER: "FC.Timer.CounterRemainder",
    },

    GENERATION: {
      SHOULD: {
        CALCULATE: {
          RANGE_NAME: "FC.Generation.Should.Calculate.RangeName",
        },
      },
    },

    FETCHER: {
      TIMER: {

//!!! (2023/07/26 Remarked) Use fetcherTimer_onTime_() and copierTimer_onTime_() directly.
//        AT_REMAINDER: "FC.Fetcher.Timer.AtRemainder",

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
        AFTER_SECONDS: "FC.Copier.Timer.AfterSeconds",
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

  GA4: {
    MEASUREMENT_ID: {
      LIST: {
        ITEM: {
          INDEX: {
            CUR: "GA4.MeasurementId.List.Item.Index.Cur",
          },
          COUNT: "GA4.MeasurementId.List.Item.Count",
        },
      },
    },
    STREAM_ID: {
      LIST: {
        STRING: "GA4.StreamId.List.String",
      },
    },
  },
};
