`mkdir -p vendor/bin/osx`

class Installer
  def initialize
    @already_installed = {}
  end

  def install_binary(executable)
    location = `which #{executable}`.chomp
    install_file(location)
  end

  def install_file(location)
    puts "installing #{location}"
    if @already_installed[location]
      puts "already installed #{location}. skipping.."
    else
      puts "copied file"
      `cp #{location} vendor/bin/osx`
      @already_installed[location] = true
      dependencies = `otool -L #{location} | tail -n '+2' | grep /usr/local`.lines
      dependencies = dependencies.
        map(&:reverse).map(&:chop).map(&:reverse). # remove first character (\t)
        map(&:split).map(&:first) # extract only lib file
      dependencies.each { |dep| self.install_file(dep) }
    end
  end
end

installer = Installer.new
installer.install_binary('ffmpeg')
