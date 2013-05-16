require 'yaml'

class DotHash < Hash
  def initialize(h = {})
    h.each do |k, v|
      self[k.to_s] = v.is_a?(Hash) ? DotHash.new(v) : v
    end
  end

  def method_missing(name, *args, &block)
    self[name.to_s]
  end
end

config_path = File.expand_path("config/application.yml", Rails.root)

if File.exists?(config_path)
  begin
    config = YAML.load_file(config_path)
  rescue Errno::ENOENT
    raise "Make sure the settings file #{config_path} exists."
  end

  Settings = DotHash.new(config[Rails.env])
else
  Settings = false
end
