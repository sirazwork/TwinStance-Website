(function () {
  'use strict';
  var containers = document.querySelectorAll('[data-subscription-plan]');
  if (!containers.length) return;

  function message(container, text) {
    container.parentElement.querySelector('[data-subscription-status]').textContent = text;
  }
  function failed(container) {
    message(container, 'PayPal could not complete checkout. Please refresh to retry or contact us for help. If you already approved a subscription, check PayPal before trying again.');
  }
  function render() {
    containers.forEach(function (container) {
      try {
        var buttons = window.paypalSubscriptions.Buttons({
          style: { shape: 'pill', color: 'blue', layout: 'vertical', label: 'subscribe' },
          createSubscription: function (data, actions) {
            var options = { plan_id: container.dataset.subscriptionPlan };
            if (options.plan_id === 'P-17L1821667003311HNKSTKVY') options.quantity = 1;
            return actions.subscription.create(options);
          },
          onApprove: function (data) {
            message(container, 'Thank you for subscribing to ' + container.dataset.subscriptionName +
              '. PayPal reference: ' + data.subscriptionID +
              '. Please contact us with this reference for payment verification and onboarding. Access is not activated automatically.');
          },
          onCancel: function () {
            message(container, 'Checkout cancelled. You can subscribe when ready or contact us with questions.');
          },
          onError: function () { failed(container); }
        });
        buttons.render('#' + container.id).catch(function () { failed(container); });
      } catch (error) {
        failed(container);
      }
    });
  }
  // Keep recurring checkout separate from the existing one-time hosted buttons.
  var sdk = document.createElement('script');
  sdk.src = 'https://www.paypal.com/sdk/js?client-id=BAAKbUhsUdNlNLoaKKKhQRui-sOmxWpBMfYR8bZywYDcJZ3wVKImgicCqW4NkPgT57l1LyNeUGLjLP0GiA&components=buttons&vault=true&intent=subscription';
  sdk.setAttribute('data-namespace', 'paypalSubscriptions');
  sdk.setAttribute('data-sdk-integration-source', 'button-factory');
  sdk.onload = render;
  sdk.onerror = function () { containers.forEach(failed); };
  document.head.appendChild(sdk);
})();
