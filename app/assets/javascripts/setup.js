// Setup Wizard. Should only be included in setup#index
$(function () {
  // setup functions for where we have hosts
  var setup_hosts = function (card, base_id, base_name) {
    card.el.find(base_id + "-type").on("change", function () {
      card.el.find(base_id + "-settings").toggle($(this).val() != "" && $(this).val() != "same");
      card.el.find(base_id + "-hosts-wrapper").toggle($(this).val() == "multiple");

      if ($(this).val() == "single")
        card.el.find(base_id + "-num-hosts").val(1).trigger("change");
      else if ($(this).val() == "multiple")
        card.el.find(base_id + "-num-hosts").trigger("change");

      // visual bug
      card.el.find(base_id + "-database").next(".popover").remove();
    });
    card.el.find(base_id + "-num-hosts").on("change", function () {
      var inputs = card.el.find(base_id + "-hosts .input-group"),
          val =  parseInt($(this).val());
      if (inputs.length > $(this).val()) {
        inputs.slice(val - inputs.length).remove();
      } else {
        var el = card.el.find(base_id + "-hosts");
        for (i = inputs.length; i < val; ++i)
          el.append($("<div />", { class: "input-group" })
            .append($("<input />", {
              class: "input-xlarge",
              name: base_name + "[hosts][" + i + "][]",
              placeholder: "IP or hostname",
              type: "text",
            })).append(" ").append($("<input />", {
              class: "input-mini",
              name: base_name + "[hosts][" + i + "][]",
              placeholder: "Port",
              type: "text",
              value: "27017",
            }))
          );
      }
    });
    card.el.find(base_id + "-auth-user").hide();
    card.el.find(base_id + "-auth-password").hide();
    card.el.find(base_id + "-opts-auth").on("change", function () {
      card.el.find(base_id + "-auth-user").toggle($(this).is(":checked"));
      card.el.find(base_id + "-auth-password").toggle($(this).is(":checked"));
      card.el.find(base_id + "-auth-password").next(".popover").remove();
    });
  };

  var validate_hosts = function (card, base_id) {
    var type_elem = card.el.find(base_id + "-type");
    if (type_elem.val() == "") {
      card.wizard.errorPopover(type_elem, "Please choose a setup type");
      return false;
    }

    var database_elem = card.el.find(base_id + "-database");
    if (database_elem.length > 0 && database_elem.val() == "") {
      card.wizard.errorPopover(database_elem, "Please enter a database name");
      return false;
    }

    if (type_elem.val() == "same")
      return true;


    var valid;

    $.ajax("/setup/hosts", {
      async: false,
      data: card.el.find(base_id + "-settings input").serialize(),
      type: "POST",
      success: function (data) {
        valid = data.valid;
        if (!valid) {
          if (data.error == 1) {
            plural = card.el.find(base_id + "-hosts .input-group").length > 1;
            card.wizard.errorPopover(card.el.find(base_id + "-hosts .input-group:first input:last"), "Invalid host" + (plural ? "s" : ""));
          } else if (data.error == 2) {
            card.wizard.errorPopover(card.el.find(base_id + "-auth-password"), "Invalid auth");
          } else {
            card.wizard.errorPopover(card.el.find(base_id + "-hosts .input-group:first input:last"), "Unknown error");
          }
        }
      },
      error: function () {
        valid = false;
      }
    });

    // we've got to manually hide error popovers?
    if (valid) {
      type_elem.next(".popover").remove();
      database_elem.next(".popover").remove();
      card.el.find(base_id + "-hosts .input-group:first input:last").next(".popover").remove();
      card.el.find(base_id + "-auth-password").next(".popover").remove();
    }

    return valid;
  };

  // lets get started
  var wizard = $("#setup-wizard").wizard({});
  $("button.wizard-close.close").hide();
  wizard.show();
  wizard.el.modal("lock");

  // mongo correction
  wizard.cards["mongo-connection"].on("loaded", function(card) {
    setup_hosts (card, "#mongo-conn", "mongo[connection]");
  });

  wizard.cards["mongo-connection"].on("validate", function(card) {
    return validate_hosts (card, "#mongo-conn");
  });

  // monitoring
  // mongo correction
  wizard.cards["stats"].on("loaded", function(card) {
    setup_hosts (card, "#stats-conn", "stats[connection]");
  });

  wizard.cards["stats"].on("validate", function(card) {
    return validate_hosts (card, "#stats-conn");
  });
  
});
