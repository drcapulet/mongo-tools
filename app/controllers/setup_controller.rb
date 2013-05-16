class SetupController < ApplicationController
  layout false

  def check_hosts
    # blah
    settings = (params[:stats] || params[:mongo])
    hosts = settings[:connection][:hosts].values
    options = { connect_timeout: 1 }
    begin
      if hosts.length > 1
        conn = Mongo::MongoReplicaSetClient.new(hosts.collect { |h| h.join(":") }, options)
      else
        conn = Mongo::MongoClient.new(hosts.first[0], hosts.first[1], options)
      end
      if conn.active? && settings[:connection][:opts] && settings[:connection][:opts][:auth]
        if conn.database_names.all? { |db| puts conn.db(db).authenticate(settings[:connection][:auth][:username], settings[:connection][:auth][:password]) }
          render json: { valid: true }
        else
          render json: { valid: false, error: 2 }
        end
      else
        render json: { valid: conn.active?, error: 1 }
      end
    rescue Mongo::ConnectionFailure => e
      render json: { valid: false, error: 1 }
    rescue Mongo::AuthenticationError => e
      render json: { valid: false, error: 2 }
    end
  end

  def finish
    config = { mongo: {}, stats: {} } 

    # mongo connection
    config[:mongo] = parse_params_to_config(params[:mongo])

    if params[:stats][:connection][:type] == "same"
      config[:stats] = config[:mongo].dup
      config[:stats][:database] = params[:stats][:connection][:database]
    else
      config[:stats] = parse_params_to_config(params[:stats])
    end
    config[:stats][:frequency] = "20s"
    config[:stats][:size] = 52428800 # 50 MB collections

    File.open(File.join(Rails.root, "config", "application.yml"), "w") {|f| f.write({ Rails.env => config }.to_yaml) }

    render json: { valid: true }
  end

  protected
    def parse_params_to_config (settings)
      config = {}
      hosts = settings[:connection][:hosts].values

      if hosts.length > 1
        config[:hosts] = hosts.collect { |h| h.join(":") }
      else
        config[:host] = hosts.first[0]
        config[:port] = hosts.first[1].to_i
      end

      if settings[:connection][:database]
        config[:database] = settings[:connection][:database]
      end

      if settings[:connection][:opts] && settings[:connection][:opts][:auth]
        settings[:username] = settings[:connection][:auth][:username]
        settings[:password] = settings[:connection][:auth][:password]
      end

      return config
    end
end
